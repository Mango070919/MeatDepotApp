
<?php
/**
 * Plugin Name: Meat Depot App Backend
 * Description: Provides REST API endpoints for the Meat Depot React App to sync data and upload images.
 * Version: 1.1
 * Author: Meat Depot Systems
 */

if (!defined('ABSPATH')) exit;

class MeatDepotAppBackend {
    private $namespace = 'md-app/v1';
    private $option_name = 'md_app_data_storage';
    private $api_key_option = 'md_app_api_key';

    public function __construct() {
        add_action('rest_api_init', array($this, 'register_routes'));
        add_action('admin_menu', array($this, 'add_admin_menu'));
        add_action('admin_init', array($this, 'register_settings'));
        
        // CORS and Cache Control support
        add_action('init', function() {
            // CORS
            header("Access-Control-Allow-Origin: *");
            header("Access-Control-Allow-Methods: POST, GET, OPTIONS, PUT, DELETE");
            header("Access-Control-Allow-Headers: Origin, X-Requested-With, Content-Type, Accept, X-API-Key");
            
            // Cache Control - Crucial for app sync
            if (strpos($_SERVER['REQUEST_URI'], 'md-app/v1/sync') !== false) {
                header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
                header("Cache-Control: post-check=0, pre-check=0", false);
                header("Pragma: no-cache");
            }
        });
    }

    public function register_routes() {
        // GET /sync - Retrieve Data
        register_rest_route($this->namespace, '/sync', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_data'),
            'permission_callback' => array($this, 'check_api_key'),
        ));

        // POST /sync - Save Data
        register_rest_route($this->namespace, '/sync', array(
            'methods' => 'POST',
            'callback' => array($this, 'save_data'),
            'permission_callback' => array($this, 'check_api_key'),
        ));

        // POST /upload - Upload Image
        register_rest_route($this->namespace, '/upload', array(
            'methods' => 'POST',
            'callback' => array($this, 'upload_image'),
            'permission_callback' => array($this, 'check_api_key'),
        ));
    }

    public function check_api_key($request) {
        $server_key = get_option($this->api_key_option);
        $client_key = $request->get_header('X-API-Key');
        
        // Allow if no key is set on server yet (initial setup) or keys match
        if (empty($server_key)) return true;
        return $server_key === $client_key;
    }

    public function get_data() {
        // Explicitly prevent caching for the response object as well
        $response = new WP_REST_Response();
        $response->header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
        $response->header('Pragma', 'no-cache');

        // We store data in a JSON file in uploads directory to avoid DB bloat
        $upload_dir = wp_upload_dir();
        $file_path = $upload_dir['basedir'] . '/md-app/data.json';

        if (file_exists($file_path)) {
            // Clear file stat cache to ensure we get the latest file modification
            clearstatcache(true, $file_path);
            
            $json = file_get_contents($file_path);
            $data = json_decode($json, true);
            $response->set_data($data);
            $response->set_status(200);
            return $response;
        }

        $response->set_data(new stdClass());
        $response->set_status(200);
        return $response;
    }

    public function save_data($request) {
        $params = $request->get_json_params();
        
        if (empty($params)) {
            return new WP_Error('no_data', 'No JSON data received', array('status' => 400));
        }

        $upload_dir = wp_upload_dir();
        $app_dir = $upload_dir['basedir'] . '/md-app';
        
        if (!file_exists($app_dir)) {
            wp_mkdir_p($app_dir);
        }

        $file_path = $app_dir . '/data.json';
        
        // Merge with existing data to prevent partial overwrites if needed
        $current_data = array();
        if (file_exists($file_path)) {
            $current_data = json_decode(file_get_contents($file_path), true);
        }
        
        // If current data isn't an array (e.g. null or first run), default to empty array
        if (!is_array($current_data)) {
            $current_data = array();
        }

        $new_data = array_merge($current_data, $params);
        $saved = file_put_contents($file_path, json_encode($new_data));

        if ($saved === false) {
            return new WP_Error('save_failed', 'Could not write to file system', array('status' => 500));
        }

        return new WP_REST_Response(array('success' => true), 200);
    }

    public function upload_image($request) {
        $params = $request->get_json_params();
        $base64 = isset($params['image']) ? $params['image'] : '';
        $name = isset($params['name']) ? $params['name'] : 'upload_' . time() . '.png';

        if (empty($base64)) {
            return new WP_Error('no_image', 'No image data provided', array('status' => 400));
        }

        // Handle Base64 strings with or without header
        if (strpos($base64, 'base64,') !== false) {
            $exploded = explode(',', $base64);
            $base64 = end($exploded);
        }

        $decoded = base64_decode($base64);
        if ($decoded === false) {
            return new WP_Error('invalid_image', 'Base64 decode failed', array('status' => 400));
        }

        $upload = wp_upload_bits($name, null, $decoded);

        if (!empty($upload['error'])) {
            return new WP_Error('upload_failed', $upload['error'], array('status' => 500));
        }

        // Create attachment in WP Media Library (optional, but good for management)
        $file_path = $upload['file'];
        $file_name = basename($file_path);
        $file_type = wp_check_filetype($file_name, null);
        $attachment_title = sanitize_file_name(pathinfo($file_name, PATHINFO_FILENAME));
        $wp_upload_dir = wp_upload_dir();

        $post_info = array(
            'guid'           => $wp_upload_dir['url'] . '/' . $file_name,
            'post_mime_type' => $file_type['type'],
            'post_title'     => $attachment_title,
            'post_content'   => '',
            'post_status'    => 'inherit',
        );

        // Insert the attachment
        $attach_id = wp_insert_attachment($post_info, $file_path);

        // Generate attachment metadata
        require_once(ABSPATH . 'wp-admin/includes/image.php');
        $attach_data = wp_generate_attachment_metadata($attach_id, $file_path);
        wp_update_attachment_metadata($attach_id, $attach_data);

        return new WP_REST_Response(array('url' => $upload['url'], 'id' => $attach_id), 200);
    }

    // --- Admin Settings ---

    public function add_admin_menu() {
        add_options_page('Meat Depot App', 'Meat Depot App', 'manage_options', 'meat-depot-app', array($this, 'settings_page'));
    }

    public function register_settings() {
        register_setting('md_app_settings', $this->api_key_option);
    }

    public function settings_page() {
        ?>
        <div class="wrap">
            <h1>Meat Depot App Settings</h1>
            <form method="post" action="options.php">
                <?php settings_fields('md_app_settings'); ?>
                <?php do_settings_sections('md_app_settings'); ?>
                <table class="form-table">
                    <tr valign="top">
                    <th scope="row">API Key</th>
                    <td>
                        <input type="text" name="<?php echo $this->api_key_option; ?>" value="<?php echo esc_attr(get_option($this->api_key_option)); ?>" class="regular-text" />
                        <p class="description">Enter a secret key here. Use the same key in the React App's Settings > Cloud > Custom Domain.</p>
                    </td>
                    </tr>
                </table>
                <?php submit_button(); ?>
            </form>
            <hr>
            <h3>Endpoints</h3>
            <p><strong>App URL:</strong> <?php echo site_url('/wp-json/md-app/v1'); ?></p>
        </div>
        <?php
    }
}

new MeatDepotAppBackend();
