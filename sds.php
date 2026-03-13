<?php
/**
 * Plugin Name: PubChem Chemical Lookup
 * Description: ดึงข้อมูลสารเคมีจาก PubChem API
 * Version: 1.0
 * Author: Jirakit Pawnsakunrungrot
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