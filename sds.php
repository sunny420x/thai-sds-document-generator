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
        <style>
        ul.popup_profile_list {
            margin: 0;
        }
        ul.popup_profile_list li {
            padding: 10px 20px;
            font-size: 14px;
            background: #f8f8f8;
            color: #111;
            transition: .2s ease-in-out;
            margin: 0;
        }
        ul.popup_profile_list li:hover {
            background: #fff;
            cursor: pointer;
        }
        .leftside {
            width: 350px;
            background: #f8f8f8;
            height: max-content;
        }
        .leftside h1 {
            background: #009FE3;
            color: #fff;
            font-size: 16px;
            padding: 10px 20px;
            margin: 0;
        }
        .container {
            width: 1200px;
            background: #fff;
        }
        .container h1 {
            background: #555;
            color: #fff;
            font-size: 16px;
            padding: 10px 20px;
            margin: 0;
        }
        .white-label-zone {
            width: calc(100% + 20px);
            height: auto;
            background: #fff;
            display: flex;
            margin: 0 0 0 -20px;
        }
        .white-label-zone h1,p {
            padding: 0 20px;
        }
    </style>
    <div class="white-label-zone no-print">
        <span style="padding: 60px 10px 60px 40px;float: left;font-size: 60px;">📄</span>
        <div style="padding: 20px 0;">
            <h1>WordPress SDS Document Generator</h1>
            <p>ระบบสร้างและออกเอกสาร Safety Data Sheet
            <br>
            <strong>Github Repository:</strong> <a href="https://github.com/sunny420x/thai-sds-document-generator" target="_blank">https://github.com/sunny420x/thai-sds-document-generator</a>
            </p>
        </div>
    </div>
    <div class="wrap">
        <div style="display: flex;">
            <div class="leftside">
                <h1>SDS Document Generator</h1>
                <div style="padding: 10px 20px 20px 20px;">
                    <a href="admin.php?page=sds-settings&option=general" class="button" style="width: 100%;">ตั้งค่าทั่วไป</a>
                    <a href="admin.php?page=sds-settings&option=replace_product_name" class="button" style="width: 100%;">แทนที่ชื่อสารเคมี</a>
                </div>
            </div>
            <div class="container">
                <?php
                if(isset($_GET['option']) && $_GET['option'] == "general") {
                ?>
                <h1>ตั้งค่าระบบออกเอกสาร SDS</h1>
                <div style="padding: 0 25px 25px 25px;">
                    <p>จัดการระบบแสดงปุ่มออกเอกสาร SDS ในสินค้า สามารถกำหนดประเภทสินค้าที่ไม่ต้องแสดงปุ่มออกเอกสาร คำที่ต้องตัดออกจากชื่อสินค้า และอื่น ๆ ได้</p>
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
                    </form>
                </div>
                <?php
                } elseif(isset($_GET['option']) && $_GET['option'] == "replace_product_name") {
                    if (isset($_POST['saveProfile'])) {
                        $profiles = get_option('replace_lists', array());
                        $id = sanitize_text_field($_POST['id']);

                        foreach ($profiles as &$profile) {
                            if ((string)$profile['id'] === (string)$id) {
                                $profile['id'] = $profile['id'];
                                $profile['name'] = sanitize_text_field($_POST['name']);
                                $profile['replace_with'] = sanitize_text_field($_POST['replace_with']);
                                break;
                            }
                        }

                        update_option('replace_lists', $profiles);
                        wp_redirect(admin_url('admin.php?page=sds-settings&option=replace_product_name'));
                        exit;
                    }

                    if (isset($_POST['newProfile'])) {
                        $profiles = get_option('replace_lists', array());

                        $profiles[] = array(
                            'id' => rand(),
                            'name' => sanitize_text_field($_POST['name']),
                            'replace_with' => sanitize_text_field($_POST['replace_with']),
                        );

                        update_option('replace_lists', $profiles);
                        wp_redirect(admin_url('admin.php?page=sds-settings&option=replace_product_name'));
                        exit;
                    }

                    if (isset($_POST['deleteProfile'])) {
                        $profiles = get_option('replace_lists', array());
                        $id = sanitize_text_field($_POST['id']);
                        $found = false;

                        foreach ($profiles as $index => $profile) {
                            if ((string)$profile['id'] === (string)$id) {
                                unset($profiles[$index]);
                                $found = true;
                                break;
                            }
                        }

                        if ($found) {
                            $profiles = array_values($profiles);

                            update_option('replace_lists', $profiles);
                            wp_redirect(admin_url('admin.php?page=sds-settings&option=replace_product_name'));
                            exit;
                        }
                    }
                ?>
                <h1>แทนที่ชื่อสารเคมี</h1>
                <div style="padding: 25px 25px 25px 25px;">
                    <table class="wp-list-table widefat fixed striped">
                        <thead>
                            <th>#</th>
                            <th>รายการ</th>
                            <th>แทนที่ด้วย</th>
                            <th>จัดการ</th>
                        </thead>
                        <tbody>
                            <?php
                                $replace_list = get_option('replace_lists', array());
                                
                                foreach($replace_list as $row) {
                                ?>
                                <form action="" method="post">
                                    <tr>
                                        <input type="hidden" name="id" value="<?=$row['id']?>">
                                        <td><?=$row['id']?></td>
                                        <td><input type="text" value="<?=$row['name']?>" name="name" style="width: 100%;"></td>
                                        <td><input type="text" value="<?=$row['replace_with']?>" name="replace_with" style="width: 100%;"></td>
                                        <td>
                                            <button class="button" name="saveProfile" type="submit">บันทึกการเปลี่ยนแปลง</button>
                                            <button class="button button-primary" name="deleteProfile" type="submit">ลบ</button>
                                        </td>
                                    </tr>
                                </form>
                                <?php
                                }
                                ?>
                                <form action="" method="post">
                                    <tr>
                                        <td></td>
                                        <td><input type="text" name="name" style="width: 100%;"></td>
                                        <td><input type="text" name="replace_with" style="width: 100%;"></td>
                                        <td><button class="button" name="newProfile" type="submit">เพิ่มโปรไฟล์ใหม่</button></td>
                                    </tr>
                                </form>
                        </tbody>
                    </table>
                </div>
                <?php
                } else {
                ?>
                <h1>SDS Document Generator</h1>
                <div style="padding: 0 25px 25px 25px;">
                    <h2>ระบบนี้คืออะไร ?</h2>
                    <p>ระบบ SDS Document Generator
                        คือระบบที่ออกแบบมาสำหรับสร้างและออกเอกสาร Safety Data Sheet สำหรับสินค้าประเภทสารเคมีภายในระบบ WooCommerce บน WordPress โดยระบบต้องการ
                        ชื่อสินค้าในรูปแบบเช่น โซดาไฟ (Sodium Hydroxide) โดยชื่อสารเคมีภายในวงเล็บจะถือว่าเป็นชื่อสารเคมีของสินค้า โดยลูกค้าจะสามารถคลิกปุ่มภายในหน้าสินค้าสำหรับออกเอกสาร SDS
                        ของสารเคมีดังกล่าวได้ โดยมีควบรวมกับระบบ Google Translation สามารถแปลเนื้อหาในเอกสารออกมาเป็นภาษาไทยได้อย่างแม่นยำ
                    </p>
                    <h2>วิธีการติดตั้ง</h2>
                    <p>
                        สามารถติดตั้งปลั้กอินนี้ได้โดยการดาวน์โหลดไฟล์นี้จาก Github หน้านี้ และอัพโหลดลงในหน้า /wp-admin/plugin-install.php หลังจากอัพโหลด 
                        และเปิดใช้งาน (Activate) ระบบจะทำการสร้างตารางและคอลัมน์ใหม่จากตารางเดิมโดยอัตโนมัติ
                    </p>
                </div>
                <?php
                }
                ?>
            </div>
        </div>
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
    register_setting('sds_replace_keyword_group', 'replace_lists');
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

    $word_to_replace = get_option("replace_lists");
    foreach ( $word_to_replace as $word ) {
        $q_param = trim( str_ireplace($word['name'], $word['replace_with'], $q_param) );
    }

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
        'official'  => 'yes'
    ), $base_url );
    ?>
    <div class="sds-button-container" style="margin: 20px 0;">
        <a href="<?=esc_url( $final_url );?>" target="_blank">
        <?=get_option('sds_btn_name', 'พิมพ์เอกสาร SDS สำหรับ'). ' ' . esc_html( $q_param );?>
        </a>
    </div>
<?php
}