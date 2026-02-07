<?php
/**
 * Plugin Name: ArtKey REST API
 * Description: Minimal REST endpoints + CPT storage for ArtKey (Next.js + WordPress integration).
 * Version: 2.0.0
 * Author: The Artful Experience
 */

if (!defined('ABSPATH')) { exit; }

final class ArtKey_REST_API_Plugin {
    const POST_TYPE = 'artkey';

    const META_TOKEN    = '_artkey_token';
    const META_JSON     = '_artkey_json';
    const META_TEMPLATE = '_artkey_template';
    const META_QR_URL   = '_artkey_qr_url';
    const META_PRINT_URL  = '_artkey_print_url';
    const META_DESIGN_URL = '_artkey_design_url';

    public static function init() {
        add_action('init', [__CLASS__, 'register_post_type']);
        add_action('init', [__CLASS__, 'register_meta_fields']);
        add_action('rest_api_init', [__CLASS__, 'register_routes']);
        register_activation_hook(__FILE__, [__CLASS__, 'activate']);
        register_deactivation_hook(__FILE__, [__CLASS__, 'deactivate']);
    }

    public static function activate() {
        self::register_post_type();
        flush_rewrite_rules();
    }

    public static function deactivate() {
        flush_rewrite_rules();
    }

    public static function can_edit() {
        return current_user_can('edit_posts');
    }

    public static function can_upload() {
        return current_user_can('upload_files');
    }

    public static function register_post_type() {
        if (post_type_exists(self::POST_TYPE)) return;

        register_post_type(self::POST_TYPE, [
            'label'        => 'ArtKeys',
            'public'       => false,
            'show_ui'      => true,  // helpful for debugging in wp-admin
            'show_in_rest' => true,  // enables /wp-json/wp/v2/artkey
            'rest_base'    => 'artkey',
            'supports'     => ['title'],
            'map_meta_cap' => true,
            'capability_type' => 'post',
        ]);
    }

    public static function sanitize_meta_value($value, $meta_key, $object_type) {
        // Store as-is (string). WP will handle serialization.
        if (is_null($value)) return '';
        if (is_bool($value)) return $value ? '1' : '0';
        if (is_scalar($value)) return (string)$value;
        return wp_json_encode($value);
    }

    public static function register_meta_fields() {
        $meta_fields = [
            self::META_TOKEN,
            self::META_JSON,
            self::META_QR_URL,
            self::META_PRINT_URL,
            self::META_DESIGN_URL,
            self::META_TEMPLATE,
        ];

        foreach ($meta_fields as $meta_key) {
            register_post_meta(self::POST_TYPE, $meta_key, [
                'show_in_rest' => true,
                'single'       => true,
                'type'         => 'string',
                'sanitize_callback' => [__CLASS__, 'sanitize_meta_value'],
                'auth_callback' => [__CLASS__, 'can_edit'],
            ]);
        }
    }

    public static function register_routes() {
        register_rest_route('artkey/v1', '/ping', [
            'methods'  => 'GET',
            'callback' => function() {
                return rest_ensure_response([
                    'ok'        => true,
                    'plugin'    => 'ArtKey REST API',
                    'version'   => '2.0.0',
                    'timestamp' => time(),
                ]);
            },
            'permission_callback' => '__return_true',
        ]);

        register_rest_route('artkey/v1', '/save', [
            'methods'  => 'POST',
            'callback' => [__CLASS__, 'rest_save'],
            'permission_callback' => [__CLASS__, 'can_edit'],
        ]);

        register_rest_route('artkey/v1', '/get/(?P<id>[A-Za-z0-9_-]{4,128})', [
            'methods'  => 'GET',
            'callback' => [__CLASS__, 'rest_get'],
            'permission_callback' => '__return_true', // public read
        ]);

        register_rest_route('artkey/v1', '/upload', [
            'methods'  => 'POST',
            'callback' => [__CLASS__, 'rest_upload'],
            'permission_callback' => [__CLASS__, 'can_upload'],
        ]);
    }

    private static function generate_token() {
        try {
            return bin2hex(random_bytes(16)); // 32-char hex
        } catch (\Exception $e) {
            return wp_generate_password(32, false);
        }
    }

    private static function find_post_id_by_token($token) {
        $token = (string)$token;
        if ($token === '') return 0;

        $posts = get_posts([
            'post_type'      => self::POST_TYPE,
            'post_status'    => 'publish',
            'posts_per_page' => 1,
            'fields'         => 'ids',
            'meta_key'       => self::META_TOKEN,
            'meta_value'     => $token,
            'no_found_rows'  => true,
        ]);

        return !empty($posts) ? (int)$posts[0] : 0;
    }

    public static function rest_save(\WP_REST_Request $request) {
        $params = $request->get_json_params();
        if (!is_array($params)) $params = [];

        $artkey_data = $params['data'] ?? null;
        if (!is_array($artkey_data) || empty($artkey_data)) {
            return new \WP_Error('missing_data', 'ArtKey data is required', ['status' => 400]);
        }

        $incoming_token = isset($artkey_data['token']) ? (string)$artkey_data['token'] : '';
        $token = (strlen($incoming_token) >= 8) ? $incoming_token : self::generate_token();

        $product_id = isset($params['product_id'])
            ? absint($params['product_id'])
            : (isset($artkey_data['product_id']) ? absint($artkey_data['product_id']) : 0);

        $requires_qr = !empty($params['requires_qr']);

        // Optionally infer requires_qr from product meta (works even if WooCommerce is not loaded).
        if ($product_id && !$requires_qr) {
            $requires_qr = (get_post_meta($product_id, '_requires_qr_code', true) === 'yes');
        }

        $qr_code_url = isset($params['qr_code_url']) ? (string)$params['qr_code_url'] : '';
        $qr_code_url = $qr_code_url ? esc_url_raw($qr_code_url) : '';

        $template = '';
        if (isset($artkey_data['theme']) && is_array($artkey_data['theme']) && isset($artkey_data['theme']['template'])) {
            $template = (string)$artkey_data['theme']['template'];
        }

        // Ensure token + product_id are present inside the stored JSON.
        $data_with_token = $artkey_data;
        $data_with_token['token'] = $token;
        if ($product_id) $data_with_token['product_id'] = $product_id;

        $existing_id = self::find_post_id_by_token($token);
        $post_args = [
            'post_type'   => self::POST_TYPE,
            'post_status' => 'publish',
            'post_title'  => 'ArtKey ' . substr($token, 0, 8),
        ];

        if ($existing_id) {
            $post_args['ID'] = $existing_id;
            $post_id = wp_update_post($post_args, true);
        } else {
            $post_id = wp_insert_post($post_args, true);
        }

        if (is_wp_error($post_id)) return $post_id;
        $post_id = (int)$post_id;

        update_post_meta($post_id, self::META_TOKEN, $token);
        update_post_meta($post_id, self::META_JSON, wp_json_encode($data_with_token));
        update_post_meta($post_id, self::META_TEMPLATE, $template);
        if ($qr_code_url) update_post_meta($post_id, self::META_QR_URL, $qr_code_url);

        $share_url = home_url('/art-key/' . rawurlencode($token));

        return rest_ensure_response([
            'success'     => true,
            'id'          => $post_id,
            'token'       => $token,
            'share_url'   => $share_url,
            'requires_qr' => $requires_qr,
        ]);
    }

    public static function rest_get(\WP_REST_Request $request) {
        $id = (string)$request->get_param('id');
        if ($id === '') {
            return new \WP_Error('missing_id', 'ArtKey ID or token is required', ['status' => 400]);
        }

        $post_id = ctype_digit($id) ? absint($id) : self::find_post_id_by_token($id);
        if (!$post_id) {
            return new \WP_Error('not_found', 'ArtKey not found', ['status' => 404]);
        }

        $post = get_post($post_id);
        if (!$post || $post->post_type !== self::POST_TYPE) {
            return new \WP_Error('not_found', 'ArtKey not found', ['status' => 404]);
        }

        $raw_json = (string)get_post_meta($post_id, self::META_JSON, true);
        $decoded = json_decode($raw_json, true);
        $data = is_array($decoded) ? $decoded : null;

        return rest_ensure_response([
            'id'     => $post_id,
            'token'  => (string)get_post_meta($post_id, self::META_TOKEN, true),
            'data'   => $data,
            'meta'   => [
                'template' => (string)get_post_meta($post_id, self::META_TEMPLATE, true),
                'qr_url'   => (string)get_post_meta($post_id, self::META_QR_URL, true),
            ],
        ]);
    }

    public static function rest_upload(\WP_REST_Request $request) {
        $files = $request->get_file_params();
        if (empty($files['file'])) {
            return new \WP_Error('no_file', 'No file uploaded (expected multipart field "file")', ['status' => 400]);
        }

        require_once ABSPATH . 'wp-admin/includes/file.php';
        require_once ABSPATH . 'wp-admin/includes/media.php';
        require_once ABSPATH . 'wp-admin/includes/image.php';

        $file = $files['file'];
        $upload = wp_handle_upload($file, ['test_form' => false]);
        if (isset($upload['error'])) {
            return new \WP_Error('upload_error', (string)$upload['error'], ['status' => 500]);
        }

        $attachment = [
            'post_mime_type' => $upload['type'],
            'post_title'     => sanitize_file_name(pathinfo($upload['file'], PATHINFO_FILENAME)),
            'post_content'   => '',
            'post_status'    => 'inherit',
        ];

        $attach_id = wp_insert_attachment($attachment, $upload['file']);
        if (is_wp_error($attach_id)) return $attach_id;

        $attach_data = wp_generate_attachment_metadata($attach_id, $upload['file']);
        wp_update_attachment_metadata($attach_id, $attach_data);

        return rest_ensure_response([
            'id'      => (int)$attach_id,
            'url'     => $upload['url'],
            'fileUrl' => $upload['url'],
        ]);
    }
}

ArtKey_REST_API_Plugin::init();
