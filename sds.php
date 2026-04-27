<?php
/**
 * Plugin Name: PubChem Chemical Lookup
 * Description: ดึงข้อมูลสารเคมีจาก PubChem API
 * Version: 1.0
 * Author: Jirakit Pawnsakunrungrot
 * Author URI: https://www.linkedin.com/in/sunny-jirakit
 * Plugin URI: https://github.com/sunny420x/thai-sds-document-generator
 */

//Deny access from URL.
if ( ! defined( 'ABSPATH' ) ) exit;

function pubchem_enqueue_assets() {
    global $post;
    if (is_page("sds") || is_page("sds-print") || is_page("official-sds-print")) {

        //Load CSS
        wp_enqueue_style(
            'style', 
            plugins_url( '/css/style.css', __FILE__ ), 
            array(), 
            time()
        );
        
        //Load JS
        wp_enqueue_script(
            'sds',
            plugins_url( '/js/sds.js', __FILE__ ),
            array(),
            time(),
            true
        );
    }
}
add_action( 'wp_enqueue_scripts', 'pubchem_enqueue_assets' );

add_action('admin_menu', 'worldchem_sds_menu');

function worldchem_sds_menu() {
    add_menu_page(
        'SDS Settings', // Title ของหน้า
        'ระบบเอกสาร SDS', // ชื่อเมนูที่โชว์ในแถบข้าง
        'manage_options', //สิทธิ์การเข้าถึง (Admin)
        'sds-settings', // Slug ของหน้า
        'sds_setting_page', // ฟังก์ชันที่ใช้พ่น HTML หน้า Setting
        'dashicons-admin-tools', // ไอคอน
        '80' // ตำแหน่งเมนู
    );
}

function sds_setting_page() {
    ?>
    <div class="wrap" style="background: #fff; padding: 20px; border-radius: 10px; margin-top: 20px;">
        <h1>ตั้งค่าระบบออกเอกสาร SDS</h1>
        <p>จัดการระบบแสดงปุ่มออกเอกสาร SDS ในสินค้า สามารถกำหนดประเภทสินค้าที่ไม่ต้องแสดงปุ่มออกเอกสาร คำที่ต้องตัดออกจากชื่อสินค้า และอื่น ๆ ได้</p>
        <hr>
        <h2>ปุ่มออกเอกสาร SDS ในหน้าสินค้า</h2>
        <form action="options.php" method="post">
            <?php
            settings_fields('sds_settings_group');
            ?>
            <table class="wp-list-table widefat fixed striped" style="margin-top: 20px;">
                <thead>
                    <tr>
                        <th>จัดการ</th>
                        <th>ตั้งค่า</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td><strong>แสดงปุ่มออกเอกสาร SDS ในหน้าสินค้าของ WooCommerce</strong></td>
                        <td><select name="sds_enable_btn" class="form-select">
                            <option value="yes" <?php if(esc_attr(get_option('sds_enable_btn', 'yes')) == "yes") { ?>selected<?php } ?>>เปิดใช้งาน</option>
                            <option value="no" <?php if(esc_attr(get_option('sds_enable_btn', 'yes')) == "no") { ?>selected<?php } ?>>ปิดใช้งาน</option>
                        </select></td>
                    </tr>
                    <tr>
                        <td><strong>ประเภทสินค้าที่ไม่ต้องแสดงปุ่มออกเอกสาร SDS</strong></td>
                        <td><textarea name="sds_exclude_categories" style="width: 500px; height: 200px;"><?php echo esc_attr(get_option('sds_exclude_categories', "เครื่องมือวิทยาศาสตร์\nบรรจุภัณฑ์")); ?></textarea></td>
                    </tr>
                    <tr>
                        <td><strong>คำที่ต้องตัดออกจากชื่อสินค้า</strong></td>
                        <td><textarea name="sds_exclude_words" style="width: 500px; height: 200px;"><?php echo esc_attr(get_option('sds_exclude_words', "USP Grade\nFood Grade\nAR Grade\nTechnical Grade\nBP Grade\nChina\nUSA\n(จีน)\n(ไทย)\n(ญี่ปุ่น)\nเกรด")); ?></textarea></td>
                    </tr>
                    <tr>
                        <td><strong>ไม่ต้องแสดงปุ่มหากสินค้าขึ้นต้นด้วย</strong></td>
                        <td><textarea name="sds_exclude_prefixes" style="width: 500px; height: 200px;"><?php echo esc_attr(get_option('sds_exclude_prefixes', 'ชุด')); ?></textarea></td>
                    </tr>
                    <tr>
                        <td><strong>เนื้อหาปุ่ม</strong></td>
                        <td><input type="text" name="sds_btn_name" style="width: 500px;" value="<?php echo esc_attr(get_option('sds_btn_name', 'พิมพ์เอกสาร SDS สำหรับ')); ?>" /></td>
                    </tr>
                </tbody>
            </table>
            <?php submit_button('บันทึกการเปลี่ยนแปลง'); ?>
            <p>Github Repository: <a href="https://github.com/sunny420x/thai-sds-document-generator" target="_blank">github.com/sunny420x/thai-sds-document-generator</a></p>
        </form>
    </div>
    <?php
}

add_action('admin_init', 'sds_settings_init');

function sds_settings_init() {
    register_setting('sds_settings_group', 'sds_exclude_categories');
    register_setting('sds_settings_group', 'sds_exclude_words');
    register_setting('sds_settings_group', 'sds_btn_name');
    register_setting('sds_settings_group', 'sds_enable_btn');
    register_setting('sds_settings_group', 'sds_exclude_prefixes');
}

add_action( 'woocommerce_single_product_summary', 'add_custom_sds_button', 35 );

function add_custom_sds_button() {
    if(get_option('sds_enable_btn', 'yes') != "yes") {
        return;
    }

    global $product;
    if ( ! $product ) return;

    $title = $product->get_title();
    $product_id = $product->get_id();
    
    // หาคำในวงเล็บก่อน
    preg_match('/\((.*?)\)/', $title, $matches);

    $exclude_categories = explode("\n", trim(get_option('sds_exclude_categories', "เครื่องมือวิทยาศาสตร์\nบรรจุภัณฑ์")));
    $exclude_categories = array_map('trim', $exclude_categories);

    $exclude_prefixes = array_map('trim', explode("\n", trim(get_option('sds_exclude_prefixes', "ชุด"))));

    // วนลูปเช็คว่าชื่อสินค้าขึ้นต้นด้วยคำไหนในลิสต์บ้าง
    foreach ( $exclude_prefixes as $prefix ) {
        if ( empty($prefix) ) continue;

        // ถ้าเจอคำที่กำหนดอยู่หน้าสุด (ตำแหน่ง 0) ให้หยุดทำงานทันที
        if ( mb_strpos( $title, $prefix ) === 0) {
            return;
        }
    }

    // เช็คว่าสินค้าอยู่ในหมวดหมู่ใดหมวดหมู่หนึ่งในลิสต์นี้หรือไม่
    if ( has_term( $exclude_categories, 'product_cat', $product_id ) ) {
        return;
    }
    
    if ( empty( $matches[1] ) ) {
        return; 
    }

    if ( ! empty( $matches[1] ) ) {
        $q_param = trim( $matches[1] );
    } else {
        $q_param = trim( preg_replace( '/\s*ขนาด.*/u', '', $title ) );
    }

    // รายการคำที่ "ต้องลบออก" (เติมเพิ่มได้เรื่อยๆ ใน array นี้ครับ)
    $words_to_remove = explode("\n", trim(get_option('sds_exclude_words', "USP Grade\nFood Grade\nAR Grade\nTechnical Grade\nBP Grade\nChina\nUSA\n(จีน)\n(ไทย)\n(ญี่ปุ่น)\nเกรด")));
    $words_to_remove = array_map('trim', $words_to_remove);

    // วนลูปสั่งลบคำที่ไม่อยากได้ออก
    foreach ( $words_to_remove as $word ) {
        // ใช้ str_ireplace เพื่อให้ไม่สนใจตัวพิมพ์เล็ก-ใหญ่ (Case-insensitive)
        $q_param = trim( str_ireplace( $word, '', $q_param ) );
    }

    // ลบเปอร์เซ็นเช่น 80% 98% ออก
    $q_param = preg_replace('/\d+(\.\d+)?\s*%/u', '', $q_param);

    $q_param = trim($q_param);

    if($q_param === '') return;

    // สร้าง URL และปุ่ม
    $base_url = "https://www.worldchemical.co.th/official-sds-print/";
    $final_url = add_query_arg( array(
        'q'         => $q_param,
        'print'     => 'yes',
        'translate' => 'yes',
        'official'  => 'yes'
    ), $base_url );

    echo '<div class="sds-button-container" style="margin: 20px 0;">';
    echo '<a href="' . esc_url( $final_url ) . '" target="_blank" class="btn btn-danger">';
    echo get_option('sds_btn_name', 'พิมพ์เอกสาร SDS สำหรับ'). ' ' . esc_html( $q_param );
    echo '</a>';
    echo '</div>';
}