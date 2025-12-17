<?php
/**
 * Plugin Name: ArtKey REST API
 * Description: Exposes ArtKey meta fields via WordPress REST API for Next.js integration
 * Version: 1.0.0
 * Author: The Artful Experience
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

/**
 * Register ArtKey custom post type (if not already registered)
 */
function artkey_register_post_type() {
    $args = array(
        'public' => false,
        'show_ui' => false,
        'show_in_rest' => true,
        'supports' => array('title', 'custom-fields'),
        'rest_base' => 'artkey',
    );
    register_post_type('artkey', $args);
}
add_action('init', 'artkey_register_post_type');

/**
 * Register ArtKey meta fields for REST API
 */
function artkey_register_meta_fields() {
    $meta_fields = array(
        '_artkey_token',
        '_artkey_json',
        '_artkey_qr_url',
        '_artkey_print_url',
        '_artkey_design_url',
        '_artkey_template',
    );

    foreach ($meta_fields as $meta_key) {
        register_post_meta('artkey', $meta_key, array(
            'show_in_rest' => true,
            'single' => true,
            'type' => 'string',
            'auth_callback' => function() {
                return current_user_can('edit_posts');
            },
        ));
    }
}
add_action('init', 'artkey_register_meta_fields');

/**
 * Custom REST endpoint: Save ArtKey
 * POST /wp-json/artkey/v1/save
 */
function artkey_rest_save($request) {
    $data = $request->get_json_params();
    $artkey_data = $data['data'] ?? null;
    $product_id = $data['product_id'] ?? null;

    if (!$artkey_data) {
        return new WP_Error('missing_data', 'ArtKey data is required', array('status' => 400));
    }

    // Generate unique token if not exists
    $token = $artkey_data['token'] ?? wp_generate_password(32, false);
    
    // Create or update ArtKey post
    $post_id = wp_insert_post(array(
        'post_type' => 'artkey',
        'post_title' => 'ArtKey ' . substr($token, 0, 8),
        'post_status' => 'publish',
        'meta_input' => array(
            '_artkey_token' => $token,
            '_artkey_json' => json_encode($artkey_data),
            '_artkey_template' => $artkey_data['theme']['template'] ?? '',
        ),
    ));

    if (is_wp_error($post_id)) {
        return $post_id;
    }

    $share_url = home_url('/art-key/' . $token);

    return new WP_REST_Response(array(
        'success' => true,
        'id' => $post_id,
        'token' => $token,
        'share_url' => $share_url,
    ), 200);
}
add_action('rest_api_init', function() {
    register_rest_route('artkey/v1', '/save', array(
        'methods' => 'POST',
        'callback' => 'artkey_rest_save',
        'permission_callback' => function() {
            return current_user_can('edit_posts');
        },
    ));
});

/**
 * Custom REST endpoint: Get ArtKey by ID or Token
 * GET /wp-json/artkey/v1/get/{id}
 */
function artkey_rest_get($request) {
    $id = $request->get_param('id');
    
    if (!$id) {
        return new WP_Error('missing_id', 'ArtKey ID is required', array('status' => 400));
    }

    // Try to find by token if ID is not numeric
    if (!is_numeric($id)) {
        $posts = get_posts(array(
            'post_type' => 'artkey',
            'meta_key' => '_artkey_token',
            'meta_value' => $id,
            'posts_per_page' => 1,
        ));
        if (empty($posts)) {
            return new WP_Error('not_found', 'ArtKey not found', array('status' => 404));
        }
        $id = $posts[0]->ID;
    }

    $post = get_post($id);
    if (!$post || $post->post_type !== 'artkey') {
        return new WP_Error('not_found', 'ArtKey not found', array('status' => 404));
    }

    $data = json_decode(get_post_meta($id, '_artkey_json', true), true);

    return new WP_REST_Response(array(
        'id' => $id,
        'token' => get_post_meta($id, '_artkey_token', true),
        'data' => $data,
    ), 200);
}
add_action('rest_api_init', function() {
    register_rest_route('artkey/v1', '/get/(?P<id>[a-zA-Z0-9]+)', array(
        'methods' => 'GET',
        'callback' => 'artkey_rest_get',
        'permission_callback' => '__return_true', // Public read access
    ));
});

/**
 * Custom REST endpoint: Upload media
 * POST /wp-json/artkey/v1/upload
 */
function artkey_rest_upload($request) {
    $files = $request->get_file_params();
    
    if (empty($files['file'])) {
        return new WP_Error('no_file', 'No file uploaded', array('status' => 400));
    }

    require_once(ABSPATH . 'wp-admin/includes/file.php');
    require_once(ABSPATH . 'wp-admin/includes/media.php');
    require_once(ABSPATH . 'wp-admin/includes/image.php');

    $file = $files['file'];
    $upload = wp_handle_upload($file, array('test_form' => false));

    if (isset($upload['error'])) {
        return new WP_Error('upload_error', $upload['error'], array('status' => 500));
    }

    $attachment = array(
        'post_mime_type' => $upload['type'],
        'post_title' => sanitize_file_name(pathinfo($upload['file'], PATHINFO_FILENAME)),
        'post_content' => '',
        'post_status' => 'inherit',
    );

    $attach_id = wp_insert_attachment($attachment, $upload['file']);
    $attach_data = wp_generate_attachment_metadata($attach_id, $upload['file']);
    wp_update_attachment_metadata($attach_id, $attach_data);

    return new WP_REST_Response(array(
        'id' => $attach_id,
        'url' => $upload['url'],
        'fileUrl' => $upload['url'],
    ), 200);
}
add_action('rest_api_init', function() {
    register_rest_route('artkey/v1', '/upload', array(
        'methods' => 'POST',
        'callback' => 'artkey_rest_upload',
        'permission_callback' => function() {
            return current_user_can('upload_files');
        },
    ));
});
