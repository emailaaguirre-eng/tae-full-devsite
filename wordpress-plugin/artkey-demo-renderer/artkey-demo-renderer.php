<?php
/**
 * Plugin Name: ArtKey Demo Renderer (Single)
 * Description: Renders a single ArtKey demo page (mobile layout) from saved ArtKey JSON/meta. Use shortcode [artkey_demo token="..."].
 * Version: 0.1.0
 * Author: EIAG / The Artful Experience
 *
 * Usage:
 * 1) Zip the folder "artkey-demo-renderer" and upload it in WP Admin -> Plugins -> Add New -> Upload.
 * 2) Create a WP page (public but unlinked), add the shortcode:
 *    [artkey_demo token="YOUR_TOKEN" noindex="1"]
 * 3) If you know the post ID instead:
 *    [artkey_demo post_id="123" noindex="1"]
 *
 * Button order:
 * - If your ArtKey JSON contains "button_order" (array) OR "features.order" (array),
 *   this renderer respects it. Supported keys:
 *   links, featured_video, spotify, guestbook, gallery, video
 */

if (!defined('ABSPATH')) exit;

// If you already printed a QR code, you can force-render the demo on that exact path.
// This keeps the QR URL working without changing it.
// Format: 'art-key/artkey-session-<token>' (no leading slash)
if (!defined('AKDR_FORCE_PAGE_URIS')) {
  define('AKDR_FORCE_PAGE_URIS', [
    'art-key/artkey-session-691e3d09ef58e',
  ]);
}

// If your QR URL is NOT a real WP Page, enable a direct rewrite route so this plugin
// can render on /art-key/artkey-session-<token>/ without needing to create pages.
if (!defined('AKDR_ENABLE_REWRITE')) {
  define('AKDR_ENABLE_REWRITE', true);
}

/**
 * Normalize a WP "base" input (site URL or /wp-json) into site base.
 */
function akdr_normalize_site_base($input) {
  $input = trim((string)$input);
  $input = rtrim($input, "/");
  $pos = strpos($input, "/wp-json");
  if ($pos !== false) {
    $input = substr($input, 0, $pos);
  }
  return $input;
}

function akdr_decode_artkey_json($raw) {
  if (is_array($raw)) return $raw;
  if (!is_string($raw) || $raw === '') return null;
  $decoded = json_decode($raw, true);
  if (json_last_error() !== JSON_ERROR_NONE) return null;
  return $decoded;
}

function akdr_extract_token_variations($token) {
  $t = sanitize_text_field((string)$token);
  $t = trim($t);
  if ($t === '') return [];
  $out = [$t];
  // If token includes prefixes, add stripped version
  $stripped = str_replace(['artkey-session-', 'session-'], '', $t);
  if ($stripped !== $t) $out[] = $stripped;
  // If token is bare, add common prefixed versions
  if ($stripped === $t) {
    $out[] = 'artkey-session-' . $t;
    $out[] = 'session-' . $t;
  }
  // Unique
  $uniq = [];
  foreach ($out as $v) {
    $v = trim((string)$v);
    if ($v === '') continue;
    $uniq[$v] = true;
  }
  return array_keys($uniq);
}

function akdr_norm_label_tokens($label) {
  $label = strtolower((string)$label);
  $label = preg_replace('/[^a-z0-9\s]+/i', ' ', $label);
  $label = preg_replace('/\s+/', ' ', $label);
  $label = trim($label);
  if ($label === '') return [];

  $stop = [
    'the' => true, 'a' => true, 'an' => true, 'and' => true, 'or' => true,
    'to' => true, 'of' => true, 'in' => true, 'on' => true, 'for' => true,
    'your' => true, 'our' => true, 'us' => true, 'at' => true, 'as' => true,
  ];

  $parts = explode(' ', $label);
  $out = [];
  foreach ($parts as $p) {
    $p = trim($p);
    if ($p === '') continue;
    if (isset($stop[$p])) continue;
    $out[$p] = true;
  }
  return array_keys($out);
}

function akdr_labels_match_fuzzy($wanted, $actual) {
  $w = strtolower(trim((string)$wanted));
  $a = strtolower(trim((string)$actual));
  if ($w === '' || $a === '') return false;
  if ($w === $a) return true;
  if (strpos($a, $w) !== false) return true;
  if (strpos($w, $a) !== false) return true;

  // Token containment (ignores common stopwords/punctuation)
  $wt = akdr_norm_label_tokens($w);
  $at = akdr_norm_label_tokens($a);
  if (count($wt) === 0 || count($at) === 0) return false;
  $aset = [];
  foreach ($at as $t) $aset[$t] = true;
  foreach ($wt as $t) {
    if (!isset($aset[$t])) return false;
  }
  return true;
}

/**
 * Try to locate an ArtKey post by token.
 * This assumes your WP has CPT "artkey" with meta key "_artkey_token" and "_artkey_json".
 */
function akdr_find_artkey_post_id_by_token($token) {
  $variants = akdr_extract_token_variations($token);
  if (count($variants) === 0) return 0;

  $q = new WP_Query([
    'post_type' => 'artkey',
    'post_status' => 'any',
    'posts_per_page' => 1,
    'fields' => 'ids',
    'meta_query' => [
      [
        'key' => '_artkey_token',
        'value' => $variants,
        'compare' => 'IN',
      ],
    ],
  ]);

  if (!empty($q->posts)) {
    return (int)$q->posts[0];
  }
  return 0;
}

/**
 * Fallback: fetch via local WP REST endpoint (if the ArtKey CPT/meta isn't directly queryable).
 * Tries:
 * - /wp-json/artkey/v1/get/<token>
 * - /wp-json/artkey/v1/get/artkey-session-<token>
 */
function akdr_fetch_artkey_data_via_rest($token) {
  $variants = akdr_extract_token_variations($token);
  if (count($variants) === 0) return null;

  $site = akdr_normalize_site_base(home_url());
  foreach ($variants as $t) {
    $url = $site . '/wp-json/artkey/v1/get/' . rawurlencode($t);
    $res = wp_remote_get($url, ['timeout' => 8]);
    if (is_wp_error($res)) continue;
    $code = wp_remote_retrieve_response_code($res);
    if ($code < 200 || $code >= 300) continue;
    $body = wp_remote_retrieve_body($res);
    $decoded = akdr_decode_artkey_json($body);
    if (is_array($decoded)) return $decoded;
  }
  return null;
}

function akdr_get_artkey_data_from_post($post_id) {
  $post_id = (int)$post_id;
  if ($post_id <= 0) return null;

  $raw = get_post_meta($post_id, '_artkey_json', true);
  $data = akdr_decode_artkey_json($raw);
  if (!$data) return null;

  // Some saves include token inside JSON; ensure.
  if (empty($data['token'])) {
    $token = get_post_meta($post_id, '_artkey_token', true);
    if ($token) $data['token'] = (string)$token;
  }
  return $data;
}

/**
 * Build button list respecting a saved order if present.
 * Order sources (first match wins):
 * - $data['button_order'] (array)
 * - $data['features']['order'] (array)
 *
 * Supported keys in order array:
 * - "links" (all custom links, in their saved order)
 * - "featured_video"
 * - "spotify"
 * - "guestbook"
 * - "gallery"
 * - "video"
 */
function akdr_parse_csv_list($value) {
  $value = (string)$value;
  $value = trim($value);
  if ($value === '') return [];
  $parts = preg_split('/\s*,\s*/', $value);
  $out = [];
  foreach ($parts as $p) {
    $p = trim((string)$p);
    if ($p !== '') $out[] = $p;
  }
  return $out;
}

function akdr_build_buttons($data, $orderOverride = null, $linkOrderOverride = null) {
  $buttons = [];

  $links = [];
  if (!empty($data['links']) && is_array($data['links'])) {
    foreach ($data['links'] as $lnk) {
      if (!is_array($lnk)) continue;
      $label = isset($lnk['label']) ? (string)$lnk['label'] : '';
      $url = isset($lnk['url']) ? (string)$lnk['url'] : '';
      if ($label === '' || $url === '') continue;
      $links[] = [
        'type' => 'link',
        'label' => $label,
        'url' => $url,
      ];
    }
  }

  // Optional: override link order by providing a comma-separated list of labels.
  // Any links not mentioned are appended in original order.
  if (is_array($linkOrderOverride) && count($linkOrderOverride) > 0 && count($links) > 1) {
    $used = [];
    $sorted = [];
    foreach ($linkOrderOverride as $wRaw) {
      $w = trim((string)$wRaw);
      if ($w === '') continue;
      foreach ($links as $idx => $lnk) {
        $key = trim((string)($lnk['label'] ?? ''));
        if ($key !== '' && akdr_labels_match_fuzzy($w, $key) && empty($used[$idx])) {
          $sorted[] = $lnk;
          $used[$idx] = true;
          break;
        }
      }
    }
    // Append leftover links in original order
    foreach ($links as $idx => $lnk) {
      if (!empty($used[$idx])) continue;
      $sorted[] = $lnk;
    }
    $links = $sorted;
  }

  $has_featured = !empty($data['featured_video']['video_url']);
  $has_spotify = !empty($data['spotify']['url']) && strlen((string)$data['spotify']['url']) > 10;
  $features = !empty($data['features']) && is_array($data['features']) ? $data['features'] : [];

  $featureFlags = [
    'featured_video' => $has_featured,
    'spotify' => $has_spotify,
    'guestbook' => !empty($features['show_guestbook']),
    'gallery' => !empty($features['enable_gallery']),
    'video' => !empty($features['enable_video']),
  ];

  $order = null;
  // 0) Shortcode override (highest priority)
  if (is_array($orderOverride) && count($orderOverride) > 0) {
    $order = $orderOverride;
  } elseif (!empty($data['button_order']) && is_array($data['button_order'])) {
    $order = $data['button_order'];
  } elseif (!empty($features['order']) && is_array($features['order'])) {
    $order = $features['order'];
  }

  // Default order if none is present.
  if (!$order) {
    $order = ['links', 'featured_video', 'spotify', 'guestbook', 'gallery', 'video'];
  }

  foreach ($order as $key) {
    $key = (string)$key;
    if ($key === 'links') {
      foreach ($links as $b) $buttons[] = $b;
      continue;
    }
    if (!isset($featureFlags[$key]) || !$featureFlags[$key]) continue;

    if ($key === 'featured_video') {
      $btnLabel = !empty($data['featured_video']['button_label']) ? (string)$data['featured_video']['button_label'] : 'Featured Video';
      $buttons[] = [
        'type' => 'anchor',
        'label' => $btnLabel,
        'href' => '#akdr-featured-video',
        'is_featured' => true,
      ];
    } elseif ($key === 'spotify') {
      $buttons[] = [
        'type' => 'anchor',
        'label' => '🎵 Share Your Playlist',
        'href' => '#akdr-spotify',
      ];
    } elseif ($key === 'guestbook') {
      $buttons[] = [
        'type' => 'anchor',
        'label' => '📖 Guestbook',
        'href' => '#akdr-guestbook',
      ];
    } elseif ($key === 'gallery') {
      $buttons[] = [
        'type' => 'anchor',
        'label' => '📸 Image Gallery',
        'href' => '#akdr-gallery',
      ];
    } elseif ($key === 'video') {
      $buttons[] = [
        'type' => 'anchor',
        'label' => '🎥 Video Gallery',
        'href' => '#akdr-videos',
      ];
    }
  }

  // If someone forgot to include "links" in order, append them.
  $hasAnyLinks = count($links) > 0;
  if ($hasAnyLinks) {
    $seenLink = false;
    foreach ($buttons as $b) {
      if (!empty($b['type']) && $b['type'] === 'link') { $seenLink = true; break; }
    }
    if (!$seenLink) {
      foreach ($links as $b) $buttons[] = $b;
    }
  }

  return $buttons;
}

function akdr_google_font_family($font) {
  $font = (string)$font;
  if (strpos($font, 'g:') === 0) {
    return trim(str_replace('g:', '', $font));
  }
  return '';
}

function akdr_shortcode($atts) {
  $atts = shortcode_atts([
    'token' => '691e3d09ef58e', // default demo token used throughout this repo
    'post_id' => '',
    'json' => '',
    'noindex' => '1',
    // Optional overrides:
    // order="links,spotify,featured_video,gallery,guestbook,video"
    // link_order="Instagram,Website,Portfolio"  (matches by link label)
    'order' => '',
    'link_order' => '',
    // Optional: override featured video button label
    'featured_label' => '',
  ], $atts, 'artkey_demo');

  $data = null;

  // 1) Explicit JSON in shortcode (highest priority)
  if (!empty($atts['json'])) {
    $data = akdr_decode_artkey_json(html_entity_decode((string)$atts['json'], ENT_QUOTES));
  }

  // 2) Post ID
  if (!$data && !empty($atts['post_id'])) {
    $data = akdr_get_artkey_data_from_post((int)$atts['post_id']);
  }

  // 3) Token -> lookup post
  if (!$data && !empty($atts['token'])) {
    $post_id = akdr_find_artkey_post_id_by_token($atts['token']);
    if ($post_id) {
      $data = akdr_get_artkey_data_from_post($post_id);
    }
  }

  // 4) Fallback to WP REST endpoint (useful if CPT/meta isn't queryable)
  if (!$data && !empty($atts['token'])) {
    $data = akdr_fetch_artkey_data_via_rest($atts['token']);
  }

  if (!$data) {
    return '<div style="padding:16px;border:1px solid #ddd;border-radius:12px;">ArtKey demo not found. Provide a valid <code>token</code> or <code>post_id</code>.</div>';
  }

  $title = !empty($data['title']) ? (string)$data['title'] : 'Your Title Here';
  $theme = !empty($data['theme']) && is_array($data['theme']) ? $data['theme'] : [];
  $bg_image = !empty($theme['bg_image_url']) ? esc_url((string)$theme['bg_image_url']) : '';
  $bg_color = !empty($theme['bg_color']) ? (string)$theme['bg_color'] : '#F6F7FB';
  $button_color = !empty($theme['button_color']) ? (string)$theme['button_color'] : '#4f46e5';
  $title_color = !empty($theme['title_color']) ? (string)$theme['title_color'] : '#4f46e5';
  $title_style = !empty($theme['title_style']) ? (string)$theme['title_style'] : 'solid';
  $font = !empty($theme['font']) ? (string)$theme['font'] : '';
  $googleFont = akdr_google_font_family($font);

  $orderOverride = akdr_parse_csv_list($atts['order']);
  $linkOrderOverride = akdr_parse_csv_list($atts['link_order']);
  $buttons = akdr_build_buttons($data, $orderOverride, $linkOrderOverride);

  // Allow overriding featured label regardless of what's saved
  if (!empty($atts['featured_label'])) {
    $fl = trim((string)$atts['featured_label']);
    if ($fl !== '') {
      foreach ($buttons as $i => $b) {
        if (!empty($b['is_featured'])) {
          $buttons[$i]['label'] = $fl;
          break;
        }
      }
    }
  }

  $images = [];
  if (!empty($data['uploadedImages']) && is_array($data['uploadedImages'])) {
    foreach ($data['uploadedImages'] as $img) {
      $u = esc_url((string)$img);
      if ($u) $images[] = $u;
    }
  }
  $videos = [];
  if (!empty($data['uploadedVideos']) && is_array($data['uploadedVideos'])) {
    foreach ($data['uploadedVideos'] as $vid) {
      $u = esc_url((string)$vid);
      if ($u) $videos[] = $u;
    }
  }

  // Background CSS (supports linear-gradient string or hex)
  $bgStyle = '';
  if ($bg_image) {
    $bgStyle = "background-image:url('{$bg_image}');background-size:cover;background-position:center;background-color:#ECECE9;";
  } else if (strpos($bg_color, 'linear-gradient') === 0) {
    $bgStyle = "background:{$bg_color};background-color:#ECECE9;";
  } else {
    $bgStyle = "background-color:" . esc_attr($bg_color) . ";";
  }

  $useTwoColumns = count($buttons) > 6;
  $btnTextColor = '#ffffff';
  $lc = strtolower($button_color);
  if (in_array($lc, ['#ffffff', '#fefefe', '#fef3c7', '#fde047', '#fffff0'], true)) $btnTextColor = '#000000';

  $titleCss = '';
  $titleSafe = esc_html($title);
  if ($title_style === 'gradient') {
    $titleCss = "color:transparent;background:linear-gradient(135deg," . esc_attr($title_color) . "," . esc_attr($button_color) . ");-webkit-background-clip:text;background-clip:text;";
  } else {
    $titleCss = "color:" . esc_attr($title_color) . ";";
  }

  $fontFamilyCss = '';
  if ($googleFont) {
    $fontFamilyCss = "font-family:'" . esc_attr($googleFont) . "', sans-serif;";
  }

  ob_start();
  ?>
  <?php if ($atts['noindex'] === '1'): ?>
    <meta name="robots" content="noindex,nofollow,noarchive,nosnippet,noimageindex" />
  <?php endif; ?>

  <?php if ($googleFont): ?>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="<?php echo esc_url('https://fonts.googleapis.com/css2?family=' . rawurlencode($googleFont) . ':wght@400;600;700&display=swap'); ?>" rel="stylesheet" />
  <?php endif; ?>

  <style>
    .akdr-wrap{max-width:540px;margin:0 auto;}
    .akdr-screen{
      border:2px solid #e2e2e0;border-radius:16px;overflow:hidden;
      min-height:680px;
    }
    .akdr-inner{
      padding:24px 24px 28px;
      min-height:680px;
      display:flex;flex-direction:column;align-items:center;text-align:center;
    }
    .akdr-title{
      margin-top:64px;margin-bottom:12px;
      font-size:28px;line-height:1.15;
      font-weight:800;
      word-break:break-word;
      letter-spacing:-0.02em;
    }
    .akdr-buttons{width:100%;max-width:380px;margin-top:12px;}
    .akdr-buttons.akdr-2col{display:grid;grid-template-columns:1fr 1fr;gap:10px;}
    .akdr-buttons.akdr-1col{display:flex;flex-direction:column;gap:10px;}
    .akdr-btn{
      width:100%;
      padding:12px 14px;
      border-radius:999px;
      font-weight:700;
      font-size:14px;
      text-decoration:none;
      display:inline-flex;align-items:center;justify-content:center;
      box-shadow:0 8px 18px rgba(0,0,0,0.10);
      transition:transform .12s ease, box-shadow .12s ease;
    }
    .akdr-btn.akdr-featured{
      border:2px solid rgba(15,15,15,0.85);
      box-shadow:0 10px 22px rgba(0,0,0,0.14);
    }
    .akdr-btn:active{transform:scale(0.98);}
    .akdr-grid{width:100%;max-width:380px;margin-top:12px;display:grid;grid-template-columns:repeat(4,1fr);gap:6px;}
    .akdr-thumb{width:100%;height:54px;object-fit:cover;border-radius:10px;border:1px solid rgba(255,255,255,0.6);box-shadow:0 6px 14px rgba(0,0,0,0.08);}
    .akdr-section{width:100%;max-width:420px;margin-top:18px;text-align:left;background:rgba(255,255,255,0.82);backdrop-filter:blur(8px);border:1px solid rgba(226,226,224,0.9);border-radius:16px;padding:14px 14px;}
    .akdr-h{margin:0 0 8px;font-size:14px;font-weight:800;}
    .akdr-muted{color:#444;font-size:13px;line-height:1.35;}
    .akdr-embed{width:100%;border:0;border-radius:12px;overflow:hidden;}
  </style>

  <div class="akdr-wrap">
    <div class="akdr-screen" style="<?php echo esc_attr($bgStyle); ?>">
      <div class="akdr-inner">
        <h1 class="akdr-title" style="<?php echo esc_attr($fontFamilyCss . $titleCss); ?>"><?php echo $titleSafe; ?></h1>

        <div class="akdr-buttons <?php echo $useTwoColumns ? 'akdr-2col' : 'akdr-1col'; ?>">
          <?php foreach ($buttons as $i => $btn): ?>
            <?php
              $label = !empty($btn['label']) ? esc_html((string)$btn['label']) : ('Button ' . ($i + 1));
              $style = 'background:' . esc_attr($button_color) . ';color:' . esc_attr($btnTextColor) . ';';
              $cls = 'akdr-btn';
              if (!empty($btn['is_featured'])) $cls .= ' akdr-featured';

              if (!empty($btn['type']) && $btn['type'] === 'link') {
                $href = esc_url((string)$btn['url']);
                echo '<a class="' . esc_attr($cls) . '" style="' . esc_attr($style) . '" href="' . $href . '" target="_blank" rel="noopener noreferrer">' . $label . '</a>';
              } else {
                $href = !empty($btn['href']) ? esc_attr((string)$btn['href']) : '#';
                echo '<a class="' . esc_attr($cls) . '" style="' . esc_attr($style) . '" href="' . $href . '">' . $label . '</a>';
              }
            ?>
          <?php endforeach; ?>
        </div>

        <?php if (count($images) > 0): ?>
          <div class="akdr-grid" id="akdr-gallery">
            <?php foreach (array_slice($images, 0, 8) as $u): ?>
              <img class="akdr-thumb" src="<?php echo esc_url($u); ?>" alt="" loading="lazy" />
            <?php endforeach; ?>
          </div>
        <?php endif; ?>

        <?php if (!empty($data['featured_video']['video_url'])): ?>
          <div class="akdr-section" id="akdr-featured-video">
            <div class="akdr-h">Featured Video</div>
            <div class="akdr-muted" style="margin-bottom:10px;">Tap play to watch.</div>
            <div class="akdr-muted">
              <a href="<?php echo esc_url((string)$data['featured_video']['video_url']); ?>" target="_blank" rel="noopener noreferrer">
                <?php echo esc_html((string)$data['featured_video']['video_url']); ?>
              </a>
            </div>
          </div>
        <?php endif; ?>

        <?php if (!empty($data['spotify']['url'])): ?>
          <div class="akdr-section" id="akdr-spotify">
            <div class="akdr-h">Playlist</div>
            <div class="akdr-muted">
              <a href="<?php echo esc_url((string)$data['spotify']['url']); ?>" target="_blank" rel="noopener noreferrer">Open Spotify</a>
            </div>
          </div>
        <?php endif; ?>

        <?php if (!empty($features['show_guestbook'])): ?>
          <div class="akdr-section" id="akdr-guestbook">
            <div class="akdr-h">Guestbook</div>
            <div class="akdr-muted">Demo mode: guestbook coming soon.</div>
          </div>
        <?php endif; ?>

        <?php if (count($videos) > 0): ?>
          <div class="akdr-section" id="akdr-videos">
            <div class="akdr-h">Videos</div>
            <ul style="margin:0;padding-left:18px;">
              <?php foreach (array_slice($videos, 0, 5) as $u): ?>
                <li class="akdr-muted"><a href="<?php echo esc_url($u); ?>" target="_blank" rel="noopener noreferrer"><?php echo esc_html($u); ?></a></li>
              <?php endforeach; ?>
            </ul>
          </div>
        <?php endif; ?>
      </div>
    </div>
  </div>
  <?php
  return ob_get_clean();
}

add_shortcode('artkey_demo', 'akdr_shortcode');

/**
 * Optional: automatically replace the content on specific page URIs to match a printed QR code.
 */
add_filter('the_content', function ($content) {
  if (!is_singular('page')) return $content;
  $post = get_queried_object();
  if (!$post || empty($post->ID)) return $content;

  $uri = get_page_uri($post);
  if (!$uri) return $content;
  foreach (AKDR_FORCE_PAGE_URIS as $forced) {
    if ($uri === $forced) {
      // Extract token from "artkey-session-<token>"
      $token = '';
      if (preg_match('/artkey-session-([a-zA-Z0-9]+)/', $uri, $m)) {
        $token = $m[1];
      }
      // Default holiday order. You can edit these strings to match your link labels.
      $shortcode = '[artkey_demo token="' . esc_attr($token) . '" noindex="1" order="links,featured_video" featured_label="Greetings From Bryant & Torrie" link_order="2025 Year In Review,Our Favorites in 2025,Leave Us A Message,The Artful Experience"]';
      return do_shortcode($shortcode);
    }
  }
  return $content;
}, 99);

/**
 * Optional: direct route handler so /art-key/artkey-session-<token>/ works
 * even if it is not a WordPress page (so your existing QR code URL can be reused).
 */
if (AKDR_ENABLE_REWRITE) {
  add_action('init', function () {
    add_rewrite_tag('%akdr_token%', '([^&]+)');
    add_rewrite_rule('^art-key/artkey-session-([a-zA-Z0-9]+)/?$', 'index.php?akdr_token=$matches[1]', 'top');
  });

  add_filter('query_vars', function ($vars) {
    $vars[] = 'akdr_token';
    return $vars;
  });

  add_action('template_redirect', function () {
    $token = get_query_var('akdr_token');
    if (!$token) return;

    // Render the demo directly (no theme template).
    status_header(200);
    header('Content-Type: text/html; charset=utf-8');

    // Match your provided order + label.
    $sc = '[artkey_demo token="' . esc_attr($token) . '" noindex="1" order="links,featured_video" featured_label="Greetings From Bryant & Torrie" link_order="2025 Year In Review,Our Favorites in 2025,Leave Us A Message,The Artful Experience"]';

    echo '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">';
    echo '<title>ArtKey</title>';
    echo '</head><body style="margin:0;padding:24px;background:#fff;font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;">';
    echo do_shortcode($sc);
    echo '</body></html>';
    exit;
  });

  register_activation_hook(__FILE__, function () {
    // Ensure rewrite rule is registered on activation.
    if (!function_exists('flush_rewrite_rules')) return;
    flush_rewrite_rules();
  });

  register_deactivation_hook(__FILE__, function () {
    if (!function_exists('flush_rewrite_rules')) return;
    flush_rewrite_rules();
  });
}

