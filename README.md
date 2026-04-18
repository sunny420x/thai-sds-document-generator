# ระบบออกเอกสาร SDS สำหรับ Wordpress + WooCommerce
ออกเอกสารข้อมูลความปลอดภัย (Safety Data Sheet) สำหรับสารเคมีต่าง ๆ ภายในร้านค้า โดยใช้ข้อมูลจาก PubChem โดยภายในปลั้กอินจะประกอบด้วยฟังก์ชั่น ค้นหาข้อมูลสารเคมีผ่านหน้าเว็บ ออกเอกสารข้อมูลความปลอดภัยผ่านหน้าเว็บ ออกเอกสารข้อมูลสารเคมีจากหน้าสินค้า โดยชื่อสินค้าต้องมี วงเล็บ โดยมีชื่อสามัญของสารเคมีอยู่ภายในวงเล็บ สามารถใส่ความเข้มข้นของสินค้าลงในวงเล็บได้ นอกเหนือจากนั้นต้องเพิ่มคำที่ต้องถูก "ตัดออก" ลงในหน้าตั้งค่าของปลั้กอิน

## การติดตั้ง ##
1. สร้าง "หน้า" บน Wordpress โดยใช้ slug ว่า "/sds" โดยหน้านี้จะใช้เป็นหน้าค้นหา
2. เพิ่ม HTML Code ดังนี้ในบนหน้าเว็บ
<pre>
&lt;div class=&quot;row&quot;&gt;
&lt;div class=&quot;col-lg&quot;&gt;
&lt;div class=&quot;row&quot;&gt;
&lt;div class=&quot;col&quot; style=&quot;padding-left: 0;&quot;&gt;
&lt;h2 style=&quot;margin-top: 0 !important;&quot;&gt;ค้นหาเอกสารข้อมูลความปลอดภัย (SDS : Safety data sheet)&lt;/h2&gt;
&lt;/div&gt;
&lt;div class=&quot;col-auto&quot;&gt;&lt;button id=&quot;printPageBtn&quot; class=&quot;btn btn-primary&quot; style=&quot;opacity: 0;&quot;&gt;พิมพ์หน้านี้&lt;/button&gt; &lt;button id=&quot;officialPrintPageBtn&quot; class=&quot;btn btn-primary&quot; style=&quot;opacity: 0;&quot;&gt;ออกเอกสาร SDS&lt;/button&gt; &lt;button id=&quot;translateBtn&quot; class=&quot;btn btn-secondary&quot; style=&quot;opacity: 0;&quot;&gt;แปลเอกสาร&lt;/button&gt;&lt;/div&gt;
&lt;/div&gt;
ค้นหาโดยใช้ชื่อเต็มเป็นภาษาอังกฤษ เช่น dichloromethane หรือ CAS Number เช่น 50-00-0 หรือสูตรทางเคมี เช่น KOH

&lt;/div&gt;
&lt;/div&gt;
&lt;div class=&quot;row&quot;&gt;&lt;input id=&quot;chemical_name&quot; class=&quot;col-lg form-control&quot; style=&quot;margin-left: 15px;&quot; type=&quot;text&quot; placeholder=&quot;กรอกชื่อสารเคมีเป็นภาษาอังกฤษ CAS Number หรือสูตรเคมี&quot; /&gt;
&lt;button id=&quot;chemical_search_btn&quot; class=&quot;btn btn-primary col-lg-auto&quot;&gt;ค้นหา&lt;/button&gt;&lt;/div&gt;
&lt;div class=&quot;row&quot;&gt;
&lt;div id=&quot;result&quot; class=&quot;col-lg&quot;&gt;&lt;/div&gt;
&lt;div id=&quot;menuElement&quot; class=&quot;col-lg-3&quot; style=&quot;display: none; height: max-content;&quot;&gt;

&lt;strong&gt;Sections&lt;/strong&gt;
&lt;ul id=&quot;menuList&quot;&gt;&lt;/ul&gt;
&lt;/div&gt;
&lt;/div&gt;
</pre>
3. สร้างหน้าสำหรับพิมพ์อย่าง่าย (ไม่ใช่เอกสารทางการ 16 ข้อ) โดยใช้ slug คือ "/sds-print"
<pre>
&lt;div class=&quot;container&quot;&gt;
&lt;input id=&quot;chemical_name&quot; class=&quot;col-lg form-control&quot; type=&quot;text&quot; placeholder=&quot;กรอกชื่อสารเคมี CAS Number หรือสูตรเคมี&quot; style=&quot;display: none;&quot; /&gt;

&lt;img src=&quot;https://www.worldchemical.co.th/wp-content/uploads/2022/06/Group-Custom.png&quot;&gt;

&lt;div id=&quot;result&quot; class=&quot;no-border&quot;&gt;&lt;/div&gt;
&lt;div class=&quot;waitingScreen notranslate&quot;&gt;
&lt;h1&gt;กรุณารอสักครู่ เรากำลังแปลเอกสารให้กับคุณ &lt;span id=&quot;translatePercentage&quot;&gt;0&lt;/span&gt;%&lt;/h1&gt;
&lt;/div&gt;
&lt;/div&gt;
</pre>

4. สร้างหน้าสำหรับพิมพ์เอกสาร SDS ทางการ 16 ข้อ โดยใช้ slug คือ "/official-sds-print"
<pre>
&lt;div class=&quot;waitingScreen notranslate&quot;&gt;
&lt;h1&gt;กรุณารอสักครู่ เรากำลังแปลเอกสารให้กับคุณ &lt;span id=&quot;translatePercentage&quot;&gt;0&lt;/span&gt;%&lt;/h1&gt;
&lt;/div&gt;
&lt;div id=&quot;official_result&quot; class=&quot;container official_print&quot;&gt;

&lt;input id=&quot;chemical_name&quot; class=&quot;col-lg form-control&quot; style=&quot;display: none;&quot; type=&quot;text&quot; placeholder=&quot;กรอกชื่อสารเคมี CAS Number หรือสูตรเคมี&quot; /&gt;
&lt;h3 class=&quot;text-center mb-0&quot;&gt;ข้อมูลความปลอดภัย (Safety Data Sheet)
&lt;span id=&quot;chemical_name_title&quot;&gt;&lt;/span&gt;&lt;/h3&gt;
&lt;span class=&quot;font-weight-bold&quot;&gt;1. การชี้บ่งสารเดี่ยวหรือสารผสม และผู้ผลิต (Identification of the substance or mixture and of the supplier)&lt;/span&gt;
&lt;div class=&quot;space&quot;&gt;&lt;span class=&quot;font-weight-bold&quot;&gt;1.1 ตัวบ่งชี้ผลิตภัณฑ์ตามระบบ GHS (GHS product identifier)&lt;/span&gt;
&lt;div class=&quot;row&quot;&gt;&lt;span class=&quot;col-4&quot;&gt;- ชื่อผลิตภัณฑ์&lt;/span&gt;
&lt;span id=&quot;product_name&quot; class=&quot;col-8&quot;&gt;ไม่มีข้อมูล&lt;/span&gt;&lt;/div&gt;
&lt;div class=&quot;row notranslate&quot;&gt;&lt;span class=&quot;col-4&quot;&gt;- ชื่อทางเคมี&lt;/span&gt;
&lt;span id=&quot;sec1_chemical_name&quot; class=&quot;col-8&quot;&gt;ไม่มีข้อมูล&lt;/span&gt;&lt;/div&gt;
&lt;div class=&quot;row notranslate&quot;&gt;&lt;span class=&quot;col-4&quot;&gt;- ชื่อเรียกอื่น&lt;/span&gt;
&lt;span id=&quot;sec1_synonyms&quot; class=&quot;col-8&quot;&gt;ไม่มีข้อมูล&lt;/span&gt;&lt;/div&gt;
&lt;div class=&quot;row notranslate&quot;&gt;&lt;span class=&quot;col-4&quot;&gt;- สูตรเคมี&lt;/span&gt;
&lt;span id=&quot;sec1_formula&quot; class=&quot;col-8&quot;&gt;ไม่มีข้อมูล&lt;/span&gt;&lt;/div&gt;
&lt;div class=&quot;row notranslate&quot;&gt;&lt;span class=&quot;col-4&quot;&gt;- น้ำหนักโมเลกุล&lt;/span&gt;
&lt;span id=&quot;sec1_molecular_weight&quot; class=&quot;col-8&quot;&gt;ไม่มีข้อมูล&lt;/span&gt;&lt;/div&gt;
&lt;div class=&quot;row&quot;&gt;&lt;span class=&quot;col-4&quot;&gt;- CAS number&lt;/span&gt;
&lt;span id=&quot;sec1_cas_number&quot; class=&quot;col-8&quot;&gt;ไม่มีข้อมูล&lt;/span&gt;&lt;/div&gt;
&lt;span class=&quot;font-weight-bold&quot;&gt;1.2 ข้อแนะนำและข้อจำกัดต่าง ๆ ในการใช้&lt;/span&gt;
&lt;p id=&quot;sec1_use_restrictions&quot; class=&quot;indent&quot;&gt;ไม่มีข้อมูล&lt;/p&gt;

&lt;/div&gt;
&lt;span class=&quot;font-weight-bold&quot;&gt;2. การบ่งชี้ความเป็นอันตราย (Hazards indentification)&lt;/span&gt;
&lt;div class=&quot;space&quot;&gt;&lt;span class=&quot;font-weight-bold&quot;&gt;2.1 การจำแนกสารเดี่ยวหรือสารผสม&lt;/span&gt;
&lt;p id=&quot;chemical_properties&quot; class=&quot;indent&quot;&gt;ไม่มีข้อมูล&lt;/p&gt;
&lt;span class=&quot;font-weight-bold&quot;&gt;2.2 องค์ประกอบของฉลาก&lt;/span&gt;
&lt;span class=&quot;font-weight-bold&quot;&gt;การติดฉลากตามข้อกำหนด (EC) No.1272/2008&lt;/span&gt;
รูปสัญลักษณ์แสดงความอันตราย
&lt;div id=&quot;ghs_pictograms&quot;&gt;ไม่มีข้อมูล&lt;/div&gt;
ข้อความแสดงความอันตราย
&lt;div id=&quot;ghs_hazard_statements&quot;&gt;ไม่มีข้อมูล&lt;/div&gt;
ข้อความแสดงข้อควรระวัง
&lt;div id=&quot;ghs_precautionary_statements&quot; class=&quot;notranslate&quot;&gt;&lt;/div&gt;
&lt;span class=&quot;font-weight-bold&quot;&gt;2.3 อันตรายอื่น ๆ&lt;/span&gt;
&lt;p id=&quot;additional_statements&quot; class=&quot;indent&quot;&gt;ไม่มีข้อมูล&lt;/p&gt;

&lt;/div&gt;
&lt;span class=&quot;font-weight-bold&quot;&gt;3. องค์ประกอบและข้อมูลเกี่ยวกับส่วนผสม (Composition / information on ingredients)&lt;/span&gt;
&lt;div class=&quot;space&quot;&gt;&lt;span class=&quot;font-weight-bold&quot;&gt;3.1 ชื่อทางเคมี (Chemical name) และความเข้มข้น&lt;/span&gt;
&lt;p id=&quot;chemical_name_and_concentration&quot; class=&quot;indent&quot;&gt;ไม่มีข้อมูล&lt;/p&gt;
&lt;span class=&quot;font-weight-bold&quot;&gt;3.2 ชื่อสามัญ (Common name) และชื่อเรียกอื่น (Synonym)&lt;/span&gt;
&lt;div class=&quot;row&quot;&gt;&lt;span class=&quot;font-weight-bold col&quot;&gt;ชื่อสามัญ&lt;/span&gt;
&lt;span id=&quot;chemical_name_2&quot; class=&quot;col&quot;&gt;ไม่มีข้อมูล&lt;/span&gt;&lt;/div&gt;
&lt;div class=&quot;row notranslate&quot;&gt;&lt;span class=&quot;font-weight-bold col&quot;&gt;ชื่อเรียกอื่น&lt;/span&gt;
&lt;span id=&quot;chemical_synonym&quot; class=&quot;col&quot;&gt;ไม่มีข้อมูล&lt;/span&gt;&lt;/div&gt;
&lt;div class=&quot;row notranslate&quot;&gt;&lt;span class=&quot;font-weight-bold col&quot;&gt;สูตรเคมี&lt;/span&gt;
&lt;span id=&quot;chemical_formula&quot; class=&quot;col&quot;&gt;ไม่มีข้อมูล&lt;/span&gt;&lt;/div&gt;
&lt;div class=&quot;row&quot;&gt;&lt;span class=&quot;font-weight-bold col&quot;&gt;ปริมาณร้อยละ&lt;/span&gt;
&lt;span id=&quot;percentage&quot; class=&quot;col&quot;&gt;ไม่มีข้อมูล&lt;/span&gt;&lt;/div&gt;
&lt;div class=&quot;row notranslate&quot;&gt;&lt;span class=&quot;font-weight-bold col&quot;&gt;น้ำหนักโมเลกุล&lt;/span&gt;
&lt;span id=&quot;molecular_weight&quot; class=&quot;col&quot;&gt;ไม่มีข้อมูล&lt;/span&gt;&lt;/div&gt;
&lt;div class=&quot;row&quot;&gt;&lt;span class=&quot;font-weight-bold col&quot;&gt;CAS Number&lt;/span&gt;
&lt;span id=&quot;cas_number&quot; class=&quot;col&quot;&gt;ไม่มีข้อมูล&lt;/span&gt;&lt;/div&gt;
&lt;div class=&quot;row&quot;&gt;&lt;span class=&quot;font-weight-bold col&quot;&gt;หมายเลขสหประชาชาติ (UN number)&lt;/span&gt;
&lt;span id=&quot;un_number&quot; class=&quot;col&quot;&gt;ไม่มีข้อมูล&lt;/span&gt;&lt;/div&gt;
&lt;div class=&quot;row&quot;&gt;&lt;span class=&quot;font-weight-bold col&quot;&gt;หมายเลข EC (EINECS)&lt;/span&gt;
&lt;span id=&quot;ec_number&quot; class=&quot;col&quot;&gt;ไม่มีข้อมูล&lt;/span&gt;&lt;/div&gt;
&lt;div id=&quot;composition_table&quot;&gt;&lt;/div&gt;
สำหรับข้อความแบบเต็มของข้อความแสดงความอันตรายที่แสดงไว้ในส่วนนี้ให้ดูส่วนที่ 16

&lt;/div&gt;
&lt;span class=&quot;font-weight-bold&quot;&gt;4. มาตรการปฐมพยาบาล (First measures)&lt;/span&gt;
&lt;div class=&quot;space&quot;&gt;&lt;span class=&quot;font-weight-bold&quot;&gt;4.1 คำอธิบายของมาตรการการปฐมพยาบาล&lt;/span&gt;
&lt;div class=&quot;row&quot;&gt;&lt;span class=&quot;col-4&quot;&gt;&lt;span class=&quot;font-weight-bold&quot;&gt;ข้อมูลแนะนำทั่วไป&lt;/span&gt;&lt;/span&gt;
&lt;span id=&quot;first_aid_general&quot; class=&quot;col-8&quot;&gt;ไม่มีข้อมูล&lt;/span&gt;&lt;/div&gt;
&lt;div class=&quot;row&quot;&gt;&lt;span class=&quot;col-4&quot;&gt;&lt;span class=&quot;font-weight-bold&quot;&gt;การหายใจเข้าไป&lt;/span&gt;&lt;/span&gt;
&lt;span id=&quot;first_aid_inhalation&quot; class=&quot;col-8&quot;&gt;ไม่มีข้อมูล&lt;/span&gt;&lt;/div&gt;
&lt;div class=&quot;row&quot;&gt;&lt;span class=&quot;col-4&quot;&gt;&lt;span class=&quot;font-weight-bold&quot;&gt;การสัมผัสผิวหนัง&lt;/span&gt;&lt;/span&gt;
&lt;span id=&quot;first_aid_skin&quot; class=&quot;col-8&quot;&gt;ไม่มีข้อมูล&lt;/span&gt;&lt;/div&gt;
&lt;div class=&quot;row&quot;&gt;&lt;span class=&quot;col-4&quot;&gt;&lt;span class=&quot;font-weight-bold&quot;&gt;การสัมผัสดวงตา&lt;/span&gt;&lt;/span&gt;
&lt;span id=&quot;first_aid_eye&quot; class=&quot;col-8&quot;&gt;ไม่มีข้อมูล&lt;/span&gt;&lt;/div&gt;
&lt;div class=&quot;row&quot;&gt;&lt;span class=&quot;col-4&quot;&gt;&lt;span class=&quot;font-weight-bold&quot;&gt;การกินหรือกลืนเข้าไป&lt;/span&gt;&lt;/span&gt;
&lt;span id=&quot;first_aid_ingestion&quot; class=&quot;col-8&quot;&gt;ไม่มีข้อมูล&lt;/span&gt;&lt;/div&gt;
&lt;span class=&quot;font-weight-bold&quot;&gt;4.2 อาการและผลกระทบที่สำคัญทั้งที่เกิดแบบเฉียบพลันและที่เกิดภายหลัง&lt;/span&gt;
&lt;p id=&quot;section4_2&quot; class=&quot;indent&quot;&gt;ไม่มีข้อมูล&lt;/p&gt;
&lt;span class=&quot;font-weight-bold&quot;&gt;4.3 ข้อควรพิจารณาทางการแพทย์ที่ต้องทำทันทีและการดูแลรักษาเฉพาะที่สำคัญที่ควรดำเนินการ&lt;/span&gt;
&lt;p id=&quot;first_aid_medical_attention&quot; class=&quot;indent&quot;&gt;ไม่มีข้อมูล&lt;/p&gt;

&lt;/div&gt;
&lt;span class=&quot;font-weight-bold&quot;&gt;5. มาตรการผจญเพลิง (Fire - fighting measure)&lt;/span&gt;
&lt;div class=&quot;space&quot;&gt;&lt;span class=&quot;font-weight-bold&quot;&gt;5.1 สารดับเพลิง&lt;/span&gt;
&lt;span class=&quot;font-weight-bold&quot;&gt;สารดับเพลิงที่เหมาะสม&lt;/span&gt;
&lt;p id=&quot;fire_fighting_extinguishing_media&quot; class=&quot;indent&quot;&gt;เลือกใช้สารที่ใช้ดับไฟอย่างเหมาะสมกับวัสดุที่อยู่ในบริเวณใกล้เคียง&lt;/p&gt;
&lt;span class=&quot;font-weight-bold&quot;&gt;5.2 ความเป็นอันตรายเฉพาะที่เกิดจากสารเคมี&lt;/span&gt;
&lt;p id=&quot;fire_fighting_specific_hazards&quot; class=&quot;indent&quot;&gt;ไม่มีข้อมูล&lt;/p&gt;
&lt;span class=&quot;font-weight-bold&quot;&gt;5.3 คำแนะนำสำหรับนักดับเพลิง&lt;/span&gt;
&lt;p id=&quot;fire_fighting_advice&quot; class=&quot;indent&quot;&gt;ไม่มีข้อมูล&lt;/p&gt;
&lt;span class=&quot;font-weight-bold&quot;&gt;5.4 ข้อมูลเพิ่มเติม&lt;/span&gt;
&lt;p id=&quot;fire_fighting_additional_info&quot; class=&quot;indent&quot;&gt;ไม่มีข้อมูล&lt;/p&gt;

&lt;/div&gt;
&lt;span class=&quot;font-weight-bold&quot;&gt;6. มาตรการจัดการเมื่อมีการหกรั่วไหลของสาร (Accident release measures)&lt;/span&gt;
&lt;div class=&quot;space&quot;&gt;&lt;span class=&quot;font-weight-bold&quot;&gt;6.1 ข้อควรระวังส่วนบุคคล อุปกรณ์คุ้มครองความปลอดภัย
และขั้นตอนปฏิบัติงานฉุกเฉิน&lt;/span&gt;
&lt;span class=&quot;font-weight-bold&quot;&gt;ข้อควรระวังส่วนบุคคล&lt;/span&gt;
&lt;p id=&quot;sec6_personal_precautions&quot; class=&quot;indent&quot;&gt;ไม่มีข้อมูล&lt;/p&gt;
&lt;span class=&quot;font-weight-bold&quot;&gt;อุปกรณ์คุ้มครองความปลอดภัย&lt;/span&gt;
&lt;p id=&quot;sec6_protective_equipment&quot; class=&quot;indent&quot;&gt;ไม่มีข้อมูล&lt;/p&gt;
&lt;span class=&quot;font-weight-bold&quot;&gt;ขั้นตอนปฏิบัติงานฉุกเฉิน&lt;/span&gt;
&lt;div id=&quot;sec6_emergency_procedures&quot;&gt;ไม่มีข้อมูล
&lt;span class=&quot;font-weight-bold&quot;&gt;6.2 ข้อควรระวังทางสิ่งแวดล้อม&lt;/span&gt;
&lt;p id=&quot;sec6_environmental_precautions&quot; class=&quot;indent&quot;&gt;ไม่มีข้อมูล&lt;/p&gt;
&lt;span class=&quot;font-weight-bold&quot;&gt;6.3 วิธีการและวัสดุสำหรับกักเก็บและทำความสะอาด (Cleaning up)&lt;/span&gt;
&lt;p id=&quot;sec6_cleanup_methods&quot; class=&quot;indent&quot;&gt;ไม่มีข้อมูล&lt;/p&gt;
&lt;span class=&quot;font-weight-bold&quot;&gt;6.4 อ้างอิงไปยังส่วนอื่น&lt;/span&gt;
&lt;p class=&quot;indent&quot;&gt;สำหรับการกำจัดของเสียให้ดูในข้อที่ 13&lt;/p&gt;

&lt;/div&gt;
&lt;/div&gt;
&lt;span class=&quot;font-weight-bold&quot;&gt;7. การขนถ่าย เคลื่อนย้ายใช้งาน และเก็บรักษา (Handling and Storage)&lt;/span&gt;
&lt;div class=&quot;space&quot;&gt;&lt;span class=&quot;font-weight-bold&quot;&gt;7.1 ข้อควรระวังในการใช้งาน&lt;/span&gt;
&lt;p id=&quot;sec7_handling_precautions&quot; class=&quot;indent&quot;&gt;ไม่มีข้อมูล&lt;/p&gt;
&lt;span class=&quot;font-weight-bold&quot;&gt;7.2 สภาวะในการจัดเก็บที่ปลอดภัย รวมทั้งวัสดุที่เข้ากันไม่ได้&lt;/span&gt;
&lt;p id=&quot;sec7_safe_storage&quot; class=&quot;indent&quot;&gt;ไม่มีข้อมูล&lt;/p&gt;
&lt;span class=&quot;font-weight-bold&quot;&gt;7.3 การใช้งานที่เฉพาะเจาะจง&lt;/span&gt;
&lt;p id=&quot;sec7_specific_use&quot; class=&quot;indent&quot;&gt;ไม่มีข้อมูล&lt;/p&gt;
&lt;span class=&quot;font-weight-bold&quot;&gt;7.4 ข้อควรระวังด้านสิ่งแวดล้อม&lt;/span&gt;
&lt;p id=&quot;sec7_environmental_precautions&quot; class=&quot;indent&quot;&gt;ไม่มีข้อมูล&lt;/p&gt;

&lt;/div&gt;
&lt;span class=&quot;font-weight-bold&quot;&gt;8. การควบคุมการรับสัมผัสและการป้องกันส่วนบุคคล (Exposure controls / personal protection)&lt;/span&gt;
&lt;div class=&quot;space&quot;&gt;&lt;span class=&quot;font-weight-bold&quot;&gt;8.1 ค่าที่ยอมรับในการสัมผัสกับสารเคมีดังกล่าวของหน่วยงานที่เกี่ยวข้องอื่น ๆ&lt;/span&gt;
&lt;div id=&quot;sec8_exposure_limits&quot; class=&quot;indent&quot;&gt;ไม่มีข้อมูล&lt;/div&gt;
&lt;span class=&quot;font-weight-bold&quot;&gt;8.2 ขีดจำกัดในการสัมผัสสารเคมี&lt;/span&gt;
&lt;div id=&quot;sec8_exposure_controls&quot;&gt;ไม่มีข้อมูล&lt;/div&gt;
&lt;span class=&quot;font-weight-bold&quot;&gt;8.3 การควบคุมทางการสัมผัส&lt;/span&gt;
&lt;span class=&quot;font-weight-bold&quot;&gt;มาตรการควบคุมทางวิศวกรรม&lt;/span&gt;
&lt;span class=&quot;font-weight-bold&quot;&gt;มาตรการป้องกันส่วนบุคคล (อุปกรณ์ป้องกันภัยส่วนบุคคล, PPE)&lt;/span&gt;
&lt;p id=&quot;sec8_ppe&quot; class=&quot;indent&quot;&gt;ไม่มีข้อมูล&lt;/p&gt;
&lt;span class=&quot;font-weight-bold&quot;&gt;การป้องกันผิวหนัง&lt;/span&gt;
&lt;p id=&quot;sec8_skin_protection&quot; class=&quot;indent&quot;&gt;ไม่มีข้อมูล&lt;/p&gt;
&lt;span class=&quot;font-weight-bold&quot;&gt;การป้องกันมือ&lt;/span&gt;
&lt;p id=&quot;sec8_hand_protection&quot; class=&quot;indent&quot;&gt;ไม่มีข้อมูล&lt;/p&gt;
&lt;span class=&quot;font-weight-bold&quot;&gt;การป้องกันระบบทางเดินหายใจ&lt;/span&gt;
&lt;p id=&quot;sec8_respiratory_protection&quot; class=&quot;indent&quot;&gt;ไม่มีข้อมูล&lt;/p&gt;
&lt;span class=&quot;font-weight-bold&quot;&gt;การควบคุมความเสี่ยงด้านสิ่งแวดล้อม&lt;/span&gt;
&lt;p id=&quot;sec8_environmental_exposure_controls&quot; class=&quot;indent&quot;&gt;ไม่มีข้อมูล&lt;/p&gt;

&lt;/div&gt;
&lt;span class=&quot;font-weight-bold&quot;&gt;9. สมบัติทางกายภาพและทางเคมี&lt;/span&gt;
&lt;div class=&quot;space&quot;&gt;
&lt;div class=&quot;row&quot;&gt;&lt;span class=&quot;col-4&quot;&gt;ความเข้มข้น&lt;/span&gt;
&lt;span id=&quot;sec9_concentration&quot; class=&quot;col-8&quot;&gt;ไม่มีข้อมูล&lt;/span&gt;&lt;/div&gt;
&lt;div class=&quot;row&quot;&gt;&lt;span class=&quot;col-4&quot;&gt;สถานะทางสภาพปรากฏ&lt;/span&gt;
&lt;span id=&quot;sec9_appearance&quot; class=&quot;col-8&quot;&gt;ไม่มีข้อมูล&lt;/span&gt;&lt;/div&gt;
&lt;div class=&quot;row&quot;&gt;&lt;span class=&quot;col-4&quot;&gt;กลิ่น&lt;/span&gt;
&lt;span id=&quot;sec9_odor&quot; class=&quot;col-8&quot;&gt;ไม่มีข้อมูล&lt;/span&gt;&lt;/div&gt;
&lt;div class=&quot;row&quot;&gt;&lt;span class=&quot;col-4&quot;&gt;ค่าขีดจำกัดของกลิ่นที่ได้รับ&lt;/span&gt;
&lt;span id=&quot;sec9_odor_threshold&quot; class=&quot;col-8&quot;&gt;ไม่มีข้อมูล&lt;/span&gt;&lt;/div&gt;
&lt;div class=&quot;row&quot;&gt;&lt;span class=&quot;col-4&quot;&gt;น้ำหนักโมเลกุล&lt;/span&gt;
&lt;span id=&quot;sec9_molecular_weight&quot; class=&quot;col-8&quot;&gt;ไม่มีข้อมูล&lt;/span&gt;&lt;/div&gt;
&lt;div class=&quot;row&quot;&gt;&lt;span class=&quot;col-4&quot;&gt;จุดหลอมเหลว / จุดเยือกแข็ง&lt;/span&gt;
&lt;span id=&quot;sec9_melting_point&quot; class=&quot;col-8&quot;&gt;ไม่มีข้อมูล&lt;/span&gt;&lt;/div&gt;
&lt;div class=&quot;row&quot;&gt;&lt;span class=&quot;col-4&quot;&gt;จุดเดือด&lt;/span&gt;
&lt;span id=&quot;sec9_boiling_point&quot; class=&quot;col-8&quot;&gt;ไม่มีข้อมูล&lt;/span&gt;&lt;/div&gt;
&lt;div class=&quot;row&quot;&gt;&lt;span class=&quot;col-4&quot;&gt;จุดวาบไฟ&lt;/span&gt;
&lt;span id=&quot;sec9_flash_point&quot; class=&quot;col-8&quot;&gt;ไม่มีข้อมูล&lt;/span&gt;&lt;/div&gt;
&lt;div class=&quot;row&quot;&gt;&lt;span class=&quot;col-4&quot;&gt;อัตราการระเหย&lt;/span&gt;
&lt;span id=&quot;sec9_evaporation_rate&quot; class=&quot;col-8&quot;&gt;ไม่มีข้อมูล&lt;/span&gt;&lt;/div&gt;
&lt;div class=&quot;row&quot;&gt;&lt;span class=&quot;col-4&quot;&gt;ความสามารถในการลุกติดไฟ&lt;/span&gt;
&lt;span id=&quot;sec9_flammability&quot; class=&quot;col-8&quot;&gt;ไม่มีข้อมูล&lt;/span&gt;&lt;/div&gt;
&lt;div class=&quot;row&quot;&gt;&lt;span class=&quot;col-4&quot;&gt;ขีดจำกัดการระเบิด : ต่ำสุด&lt;/span&gt;
&lt;span id=&quot;sec9_explosive_limit_lower&quot; class=&quot;col-8&quot;&gt;ไม่มีข้อมูล&lt;/span&gt;&lt;/div&gt;
&lt;div class=&quot;row&quot;&gt;&lt;span class=&quot;col-4&quot;&gt;สูงสุด&lt;/span&gt;
&lt;span id=&quot;sec9_explosive_limit_upper&quot; class=&quot;col-8&quot;&gt;ไม่มีข้อมูล&lt;/span&gt;&lt;/div&gt;
&lt;div class=&quot;row&quot;&gt;&lt;span class=&quot;col-4&quot;&gt;ความถ่วงจำเพาะ (น้ำ = 1)&lt;/span&gt;
&lt;span id=&quot;sec9_specific_gravity&quot; class=&quot;col-8&quot;&gt;ไม่มีข้อมูล&lt;/span&gt;&lt;/div&gt;
&lt;div class=&quot;row&quot;&gt;&lt;span class=&quot;col-4&quot;&gt;ความหนาแน่นสัมพัทธ์ (อากาศ = 1)&lt;/span&gt;
&lt;span id=&quot;sec9_vapor_density&quot; class=&quot;col-8&quot;&gt;ไม่มีข้อมูล&lt;/span&gt;&lt;/div&gt;
&lt;div class=&quot;row&quot;&gt;&lt;span class=&quot;col-4&quot;&gt;ความหนาแน่น&lt;/span&gt;
&lt;span id=&quot;sec9_density&quot; class=&quot;col-8&quot;&gt;ไม่มีข้อมูล&lt;/span&gt;&lt;/div&gt;
&lt;div class=&quot;row&quot;&gt;&lt;span class=&quot;col-4&quot;&gt;ความสามารถในการละลายน้ำ&lt;/span&gt;
&lt;span id=&quot;sec9_water_solubility&quot; class=&quot;col-8&quot;&gt;ไม่มีข้อมูล&lt;/span&gt;&lt;/div&gt;
&lt;div class=&quot;row&quot;&gt;&lt;span class=&quot;col-4&quot;&gt;ความดันไอ&lt;/span&gt;
&lt;span id=&quot;sec9_vapor_pressure&quot; class=&quot;col-8&quot;&gt;ไม่มีข้อมูล&lt;/span&gt;&lt;/div&gt;
&lt;div class=&quot;row&quot;&gt;&lt;span class=&quot;col-4&quot;&gt;แรงตึงผิว&lt;/span&gt;
&lt;span id=&quot;sec9_surface_tension&quot; class=&quot;col-8&quot;&gt;ไม่มีข้อมูล&lt;/span&gt;&lt;/div&gt;
&lt;div class=&quot;row&quot;&gt;&lt;span class=&quot;col-4&quot;&gt;ความหนืด&lt;/span&gt;
&lt;span id=&quot;sec9_viscosity&quot; class=&quot;col-8&quot;&gt;ไม่มีข้อมูล&lt;/span&gt;&lt;/div&gt;
&lt;div class=&quot;row&quot;&gt;&lt;span class=&quot;col-4&quot;&gt;สัมประสิทธิ์การแพร่กระจายในน้ำ&lt;/span&gt;
&lt;span id=&quot;sec9_diffusion_coefficient&quot; class=&quot;col-8&quot;&gt;ไม่มีข้อมูล&lt;/span&gt;&lt;/div&gt;
&lt;div class=&quot;row&quot;&gt;&lt;span class=&quot;col-4&quot;&gt;ค่าความเป็นกรด - ด่าง (pH)&lt;/span&gt;
&lt;span id=&quot;sec9_ph&quot; class=&quot;col-8&quot;&gt;ไม่มีข้อมูล&lt;/span&gt;&lt;/div&gt;
&lt;div class=&quot;row&quot;&gt;&lt;span class=&quot;col-4&quot;&gt;สัมประสิทธิ์การแบ่งชั้น&lt;/span&gt;
&lt;span id=&quot;sec9_partition_coefficient&quot; class=&quot;col-8&quot;&gt;ไม่มีข้อมูล&lt;/span&gt;&lt;/div&gt;
&lt;div class=&quot;row&quot;&gt;&lt;span class=&quot;col-4&quot;&gt;(n-octanol/water)&lt;/span&gt;
&lt;span id=&quot;sec9_log_kow&quot; class=&quot;col-8&quot;&gt;ไม่มีข้อมูล&lt;/span&gt;&lt;/div&gt;
&lt;div class=&quot;row&quot;&gt;&lt;span class=&quot;col-4&quot;&gt;อุณหภูมิที่สามารถติดไฟได้เอง&lt;/span&gt;
&lt;span id=&quot;sec9_autoignition_temperature&quot; class=&quot;col-8&quot;&gt;ไม่มีข้อมูล&lt;/span&gt;&lt;/div&gt;
&lt;div class=&quot;row&quot;&gt;&lt;span class=&quot;col-4&quot;&gt;อุณหภูมิที่สลายตัว&lt;/span&gt;
&lt;span id=&quot;sec9_decomposition_temperature&quot; class=&quot;col-8&quot;&gt;ไม่มีข้อมูล&lt;/span&gt;&lt;/div&gt;
&lt;div class=&quot;row&quot;&gt;&lt;span class=&quot;col-4&quot;&gt;คุณสมบัติทางการระเบิด&lt;/span&gt;
&lt;span id=&quot;sec9_explosive_properties&quot; class=&quot;col-8&quot;&gt;ไม่มีข้อมูล&lt;/span&gt;&lt;/div&gt;
&lt;div class=&quot;row&quot;&gt;&lt;span class=&quot;col-4&quot;&gt;คุณสมบัติในการออกซิไดซ์&lt;/span&gt;
&lt;span id=&quot;sec9_oxidizing_properties&quot; class=&quot;col-8&quot;&gt;ไม่มีข้อมูล&lt;/span&gt;&lt;/div&gt;
&lt;/div&gt;
&lt;span class=&quot;font-weight-bold&quot;&gt;10. ความเสถียรและการเกิดปฏิกิริยา (Stability and reactivity)&lt;/span&gt;
&lt;div class=&quot;space&quot;&gt;&lt;span class=&quot;font-weight-bold&quot;&gt;10.1 ความว่องไวต่อปฏิกิริยา&lt;/span&gt;
&lt;p id=&quot;sec10_reactivity&quot; class=&quot;indent&quot;&gt;ไม่มีข้อมูล&lt;/p&gt;
&lt;span class=&quot;font-weight-bold&quot;&gt;10.2 ความคงตัวทางเคมี&lt;/span&gt;
&lt;p id=&quot;sec10_chemical_stability&quot; class=&quot;indent&quot;&gt;ไม่มีข้อมูล&lt;/p&gt;
&lt;span class=&quot;font-weight-bold&quot;&gt;10.3 ปฏิกิริยาที่มีความอันตรายที่สามารถเกิดขึ้นได้&lt;/span&gt;
&lt;p id=&quot;sec10_hazardous_reactions&quot; class=&quot;indent&quot;&gt;ไม่มีข้อมูล&lt;/p&gt;
&lt;span class=&quot;font-weight-bold&quot;&gt;10.4 สภาวะที่ควรหลีกเลี่ยง&lt;/span&gt;
&lt;p id=&quot;sec10_conditions_to_avoid&quot; class=&quot;indent&quot;&gt;ไม่มีข้อมูล&lt;/p&gt;
&lt;span class=&quot;font-weight-bold&quot;&gt;10.5 วัสดุและสารที่เข้ากันไม่ได้&lt;/span&gt;
&lt;p id=&quot;sec10_incompatible_materials&quot; class=&quot;indent&quot;&gt;ไม่มีข้อมูล&lt;/p&gt;
&lt;span class=&quot;font-weight-bold&quot;&gt;10.6 สารเคมีอันตรายที่เกิดจากการสลายตัว&lt;/span&gt;
&lt;p id=&quot;sec10_hazardous_decomposition_products&quot; class=&quot;indent&quot;&gt;ไม่มีข้อมูล&lt;/p&gt;

&lt;/div&gt;
&lt;span class=&quot;font-weight-bold&quot;&gt;11. ข้อมูลด้านพิษวิทยา (Toxicological information)&lt;/span&gt;
&lt;div class=&quot;space&quot;&gt;&lt;span class=&quot;font-weight-bold&quot;&gt;11.1 ข้อมูลเกี่ยวกับผลกระทบทางพิษวิทยา&lt;/span&gt;
&lt;span class=&quot;font-weight-bold&quot;&gt;ความเป็นพิษเฉียบพลัน&lt;/span&gt;
&lt;p id=&quot;sec11_acute_toxicity&quot; class=&quot;indent&quot;&gt;ไม่มีข้อมูล&lt;/p&gt;
&lt;span class=&quot;font-weight-bold&quot;&gt;ความเป็นพิษทางปากเฉียบพลัน&lt;/span&gt;
&lt;p id=&quot;sec11_acute_oral_toxicity&quot; class=&quot;indent&quot;&gt;ไม่มีข้อมูล&lt;/p&gt;
&lt;span class=&quot;font-weight-bold&quot;&gt;ความเป็นพิษเฉียบพลันเมื่อสูดดม&lt;/span&gt;
&lt;p id=&quot;sec11_acute_inhalation_toxicity&quot; class=&quot;indent&quot;&gt;ไม่มีข้อมูล&lt;/p&gt;
&lt;span class=&quot;font-weight-bold&quot;&gt;การกัดกร่อน/การระคายเคืองต่อผิวหนัง&lt;/span&gt;
&lt;p id=&quot;sec11_skin_corrosion_irritation&quot; class=&quot;indent&quot;&gt;ไม่มีข้อมูล&lt;/p&gt;
&lt;span class=&quot;font-weight-bold&quot;&gt;การทำอันตรายต่อดวงตา/การระคายเคืองต่อดวงตา&lt;/span&gt;
&lt;p id=&quot;sec11_eye_damage_irritation&quot; class=&quot;indent&quot;&gt;ไม่มีข้อมูล&lt;/p&gt;
&lt;span class=&quot;font-weight-bold&quot;&gt;การทำให้ไวต่อการกระตุ้นอาการแพ้ต่อระบบทางเดินหายใจหรือผิวหนัง&lt;/span&gt;
&lt;p id=&quot;sec11_sensitization&quot; class=&quot;indent&quot;&gt;ไม่มีข้อมูล&lt;/p&gt;
&lt;span class=&quot;font-weight-bold&quot;&gt;การกลายพันธุ์ของเซลล์สืบพันธุ์&lt;/span&gt;
&lt;p id=&quot;sec11_germ_cell_mutagenicity&quot; class=&quot;indent&quot;&gt;ไม่มีข้อมูล&lt;/p&gt;
&lt;span class=&quot;font-weight-bold&quot;&gt;การเป็นสารก่อมะเร็ง&lt;/span&gt;
&lt;p id=&quot;sec11_carcinogenicity&quot; class=&quot;indent&quot;&gt;ไม่มีข้อมูล&lt;/p&gt;
&lt;span class=&quot;font-weight-bold&quot;&gt;ความเป็นพิษต่อระบบสืบพันธุ์&lt;/span&gt;
&lt;p id=&quot;sec11_reproductive_toxicity&quot; class=&quot;indent&quot;&gt;ไม่มีข้อมูล&lt;/p&gt;
&lt;span class=&quot;font-weight-bold&quot;&gt;การทำให้เกิดความผิดปกติของการพัฒนาการทางร่างกายของทารกภายในครรภ์&lt;/span&gt;
&lt;p id=&quot;sec11_developmental_toxicity&quot; class=&quot;indent&quot;&gt;ไม่มีข้อมูล&lt;/p&gt;
&lt;span class=&quot;font-weight-bold&quot;&gt;ความเป็นพิษต่ออวัยวะเป้าหมายอย่างเฉพาะเจาะจง จากการสัมผัสเพียงครั้งเดียว&lt;/span&gt;
&lt;p id=&quot;sec11_stot_single_exposure&quot; class=&quot;indent&quot;&gt;ไม่มีข้อมูล&lt;/p&gt;
&lt;span class=&quot;font-weight-bold&quot;&gt;ความเป็นพิษต่ออวัยวะเป้าหมายอย่างเฉพาะเจาะจง จากการสัมผัสหลายครั้ง&lt;/span&gt;
&lt;p id=&quot;sec11_stot_repeated_exposure&quot; class=&quot;indent&quot;&gt;ไม่มีข้อมูล&lt;/p&gt;
&lt;span class=&quot;font-weight-bold&quot;&gt;ความเป็นอันตรายจากการสำลัก&lt;/span&gt;
&lt;p id=&quot;sec11_aspiration_hazard&quot; class=&quot;indent&quot;&gt;ไม่มีข้อมูล&lt;/p&gt;
&lt;span class=&quot;font-weight-bold&quot;&gt;ข้อมูลเพิ่มเติม&lt;/span&gt;
&lt;p id=&quot;sec11_additional_information&quot; class=&quot;indent&quot;&gt;ไม่มีข้อมูล&lt;/p&gt;

&lt;/div&gt;
&lt;span class=&quot;font-weight-bold&quot;&gt;12. ข้อมูลด้านนิเวศวิทยา (Ecological information)&lt;/span&gt;
&lt;div class=&quot;space&quot;&gt;&lt;span class=&quot;font-weight-bold&quot;&gt;12.1 ความเป็นพิษ&lt;/span&gt;
&lt;p id=&quot;sec12_ecotoxicity&quot; class=&quot;indent&quot;&gt;ไม่มีข้อมูล&lt;/p&gt;
&lt;span class=&quot;font-weight-bold&quot;&gt;12.2 การตกค้างและความสามารถในการย่อยสลาย&lt;/span&gt;
&lt;p id=&quot;sec12_persistence_degradability&quot; class=&quot;indent&quot;&gt;ไม่มีข้อมูล&lt;/p&gt;
&lt;span class=&quot;font-weight-bold&quot;&gt;12.3 ความสามารถในการสะสมทางชีวภาพ&lt;/span&gt;
&lt;p id=&quot;sec12_bioaccumulation&quot; class=&quot;indent&quot;&gt;ไม่มีข้อมูล&lt;/p&gt;
&lt;span class=&quot;font-weight-bold&quot;&gt;12.4 ความสามารถในการเคลื่อนที่ในดิน&lt;/span&gt;
&lt;p id=&quot;sec12_mobility_soil&quot; class=&quot;indent&quot;&gt;ไม่มีข้อมูล&lt;/p&gt;
&lt;span class=&quot;font-weight-bold&quot;&gt;12.5 ผลกระทบอื่น ๆ ที่เกิดขึ้น&lt;/span&gt;
&lt;p id=&quot;sec12_other_effects&quot; class=&quot;indent&quot;&gt;ไม่มีข้อมูล&lt;/p&gt;

&lt;/div&gt;
&lt;span class=&quot;font-weight-bold&quot;&gt;13. ข้อพิจารณาในการกำจัด (Disposal consideration)&lt;/span&gt;
&lt;div class=&quot;space&quot;&gt;&lt;span class=&quot;font-weight-bold&quot;&gt;ผลิตภัณฑ์&lt;/span&gt;
&lt;span class=&quot;font-weight-bold&quot;&gt;บรรจุภัณฑ์ที่ปนเปื้อน&lt;/span&gt;
&lt;p id=&quot;sec13_contaminated_packaging&quot; class=&quot;indent&quot;&gt;ไม่มีข้อมูล&lt;/p&gt;

&lt;/div&gt;
&lt;span class=&quot;font-weight-bold&quot;&gt;14. ข้อมูลการขนส่ง (Transport information)&lt;/span&gt;
&lt;div class=&quot;space&quot;&gt;&lt;span class=&quot;font-weight-bold&quot;&gt;การขนส่งทางบก (ADR/RID)&lt;/span&gt;
&lt;div class=&quot;row&quot;&gt;&lt;span class=&quot;col&quot;&gt;ชื่อในการขนส่ง&lt;/span&gt;
&lt;span id=&quot;sec14_adr_shipping_name&quot; class=&quot;col&quot;&gt;ไม่มีข้อมูล&lt;/span&gt;&lt;/div&gt;
&lt;div class=&quot;row&quot;&gt;&lt;span class=&quot;col&quot;&gt;หมายเลขสหประชาชาติ&lt;/span&gt;
&lt;span id=&quot;sec14_adr_un_number&quot; class=&quot;col&quot;&gt;ไม่มีข้อมูล&lt;/span&gt;&lt;/div&gt;
&lt;div class=&quot;row&quot;&gt;&lt;span class=&quot;col&quot;&gt;ประเภทความเป็นอันตรายสำหรับการขนส่ง&lt;/span&gt;
&lt;span id=&quot;sec14_adr_class&quot; class=&quot;col&quot;&gt;ไม่มีข้อมูล&lt;/span&gt;&lt;/div&gt;
&lt;div class=&quot;row&quot;&gt;&lt;span class=&quot;col&quot;&gt;กลุ่มการบรรจุ&lt;/span&gt;
&lt;span id=&quot;sec14_adr_packing_group&quot; class=&quot;col&quot;&gt;ไม่มีข้อมูล&lt;/span&gt;&lt;/div&gt;
&lt;div class=&quot;row&quot;&gt;&lt;span class=&quot;col&quot;&gt;มาตรฐานรหัสแท็งก์ที่ยึดติดกับตัวรถ&lt;/span&gt;
&lt;span id=&quot;sec14_adr_tank_code&quot; class=&quot;col&quot;&gt;ไม่มีข้อมูล&lt;/span&gt;&lt;/div&gt;
&lt;div class=&quot;row&quot;&gt;&lt;span class=&quot;col&quot;&gt;ความเป็นอันตรายต่อสิ่งแวดล้อม&lt;/span&gt;
&lt;span id=&quot;sec14_adr_environmental_hazard&quot; class=&quot;col&quot;&gt;ไม่มีข้อมูล&lt;/span&gt;&lt;/div&gt;
&lt;div class=&quot;row&quot;&gt;&lt;span class=&quot;col&quot;&gt;ข้อควรระวังพิเศษสำหรับผู้ใช้&lt;/span&gt;
&lt;span id=&quot;sec14_adr_special_precautions&quot; class=&quot;col&quot;&gt;ไม่มีข้อมูล&lt;/span&gt;&lt;/div&gt;
&lt;span class=&quot;font-weight-bold&quot;&gt;การขนส่งทางทะเล (IMDG)&lt;/span&gt;
&lt;div class=&quot;row&quot;&gt;&lt;span class=&quot;col&quot;&gt;ชื่อในการขนส่ง&lt;/span&gt;
&lt;span id=&quot;sec14_imdg_shipping_name&quot; class=&quot;col&quot;&gt;ไม่มีข้อมูล&lt;/span&gt;&lt;/div&gt;
&lt;div class=&quot;row&quot;&gt;&lt;span class=&quot;col&quot;&gt;หมายเลขสหประชาชาติ&lt;/span&gt;
&lt;span id=&quot;sec14_imdg_un_number&quot; class=&quot;col&quot;&gt;ไม่มีข้อมูล&lt;/span&gt;&lt;/div&gt;
&lt;div class=&quot;row&quot;&gt;&lt;span class=&quot;col&quot;&gt;ประเภทความเป็นอันตรายสำหรับการขนส่ง&lt;/span&gt;
&lt;span id=&quot;sec14_imdg_class&quot; class=&quot;col&quot;&gt;ไม่มีข้อมูล&lt;/span&gt;&lt;/div&gt;
&lt;div class=&quot;row&quot;&gt;&lt;span class=&quot;col&quot;&gt;กลุ่มการบรรจุ&lt;/span&gt;
&lt;span id=&quot;sec14_imdg_packing_group&quot; class=&quot;col&quot;&gt;ไม่มีข้อมูล&lt;/span&gt;&lt;/div&gt;
&lt;div class=&quot;row&quot;&gt;&lt;span class=&quot;col&quot;&gt;มลภาวะทางทะเล&lt;/span&gt;
&lt;span id=&quot;sec14_imdg_marine_pollutant&quot; class=&quot;col&quot;&gt;ไม่มีข้อมูล&lt;/span&gt;&lt;/div&gt;
&lt;div class=&quot;row&quot;&gt;&lt;span class=&quot;col&quot;&gt;ข้อควรระวังพิเศษสำหรับผู้ใช้&lt;/span&gt;
&lt;span id=&quot;sec14_imdg_special_precautions&quot; class=&quot;col&quot;&gt;ไม่มีข้อมูล&lt;/span&gt;&lt;/div&gt;
&lt;span class=&quot;font-weight-bold&quot;&gt;การขนส่งทางอากาศ (IATA)&lt;/span&gt;
&lt;div class=&quot;row&quot;&gt;&lt;span class=&quot;col&quot;&gt;ชื่อในการขนส่ง&lt;/span&gt;
&lt;span id=&quot;sec14_iata_shipping_name&quot; class=&quot;col&quot;&gt;ไม่มีข้อมูล&lt;/span&gt;&lt;/div&gt;
&lt;div class=&quot;row&quot;&gt;&lt;span class=&quot;col&quot;&gt;หมายเลขสหประชาชาติ&lt;/span&gt;
&lt;span id=&quot;sec14_iata_un_number&quot; class=&quot;col&quot;&gt;ไม่มีข้อมูล&lt;/span&gt;&lt;/div&gt;
&lt;div class=&quot;row&quot;&gt;&lt;span class=&quot;col&quot;&gt;ประเภทความเป็นอันตรายสำหรับการขนส่ง&lt;/span&gt;
&lt;span id=&quot;sec14_iata_class&quot; class=&quot;col&quot;&gt;ไม่มีข้อมูล&lt;/span&gt;&lt;/div&gt;
&lt;div class=&quot;row&quot;&gt;&lt;span class=&quot;col&quot;&gt;กลุ่มการบรรจุ&lt;/span&gt;
&lt;span id=&quot;sec14_iata_packing_group&quot; class=&quot;col&quot;&gt;ไม่มีข้อมูล&lt;/span&gt;&lt;/div&gt;
&lt;div class=&quot;row&quot;&gt;&lt;span class=&quot;col&quot;&gt;ความเป็นอันตรายต่อสิ่งแวดล้อม&lt;/span&gt;
&lt;span id=&quot;sec14_iata_environmental_hazard&quot; class=&quot;col&quot;&gt;ไม่มีข้อมูล&lt;/span&gt;&lt;/div&gt;
&lt;div class=&quot;row&quot;&gt;&lt;span class=&quot;col&quot;&gt;ข้อควรระวังพิเศษสำหรับผู้ใช้&lt;/span&gt;
&lt;span id=&quot;sec14_iata_special_precautions&quot; class=&quot;col&quot;&gt;ไม่มีข้อมูล&lt;/span&gt;&lt;/div&gt;
&lt;span class=&quot;font-weight-bold&quot;&gt;การขนส่งทางน้ำในประเทศ (AND/ADNR)&lt;/span&gt;
&lt;div class=&quot;row&quot;&gt;&lt;span class=&quot;col&quot;&gt;ชื่อในการขนส่ง&lt;/span&gt;
&lt;span id=&quot;sec14_adnr_shipping_name&quot; class=&quot;col&quot;&gt;ไม่มีข้อมูล&lt;/span&gt;&lt;/div&gt;
&lt;div class=&quot;row&quot;&gt;&lt;span class=&quot;col&quot;&gt;หมายเลขสหประชาชาติ&lt;/span&gt;
&lt;span id=&quot;sec14_adnr_un_number&quot; class=&quot;col&quot;&gt;ไม่มีข้อมูล&lt;/span&gt;&lt;/div&gt;
&lt;div class=&quot;row&quot;&gt;&lt;span class=&quot;col&quot;&gt;ประเภทความเป็นอันตรายสำหรับการขนส่ง&lt;/span&gt;
&lt;span id=&quot;sec14_adnr_class&quot; class=&quot;col&quot;&gt;ไม่มีข้อมูล&lt;/span&gt;&lt;/div&gt;
&lt;div class=&quot;row&quot;&gt;&lt;span class=&quot;col&quot;&gt;กลุ่มการบรรจุ&lt;/span&gt;
&lt;span id=&quot;sec14_adnr_packing_group&quot; class=&quot;col&quot;&gt;ไม่มีข้อมูล&lt;/span&gt;&lt;/div&gt;
&lt;div class=&quot;row&quot;&gt;&lt;span class=&quot;col&quot;&gt;ความเป็นอันตรายต่อสิ่งแวดล้อม&lt;/span&gt;
&lt;span id=&quot;sec14_adnr_environmental_hazard&quot; class=&quot;col&quot;&gt;ไม่มีข้อมูล&lt;/span&gt;&lt;/div&gt;
&lt;div class=&quot;row&quot;&gt;&lt;span class=&quot;col&quot;&gt;ข้อควรระวังพิเศษสำหรับผู้ใช้&lt;/span&gt;
&lt;span id=&quot;sec14_adnr_special_precautions&quot; class=&quot;col&quot;&gt;ไม่มีข้อมูล&lt;/span&gt;&lt;/div&gt;
&lt;/div&gt;
&lt;span class=&quot;font-weight-bold&quot;&gt;15. ข้อมูลด้านกฎข้อบังคับ (Regulatory information)&lt;/span&gt;
&lt;div class=&quot;space&quot;&gt;
&lt;p class=&quot;indent&quot;&gt;สารนี้อยู่ภายใต้ข้อกำหนดของพระราชบัญญัติวัตถุอันตราย พ.ศ.2535 และที่แก้ไขเพิ่มเติม
ผู้ใช้งานต้องปฏิบัติตามกฎหมายและข้อบังคับด้านสารเคมีของประเทศไทย&lt;/p&gt;

&lt;/div&gt;
&lt;span class=&quot;font-weight-bold&quot;&gt;16. ข้อมูลอื่น ๆ (Other Information)&lt;/span&gt;
&lt;div class=&quot;space&quot;&gt;&lt;span class=&quot;font-weight-bold&quot;&gt;ข้อความแบบเต็มของข้อความแสดงความอันตรายที่แสดงไว้ในข้อที่ 2 และ 3&lt;/span&gt;
&lt;span class=&quot;font-weight-bold&quot;&gt;ข้อควรระวัง&lt;/span&gt;
&lt;p class=&quot;indent&quot;&gt;สังเกตฉลากและข้อมูลความปลอดภัยของสารเคมีก่อนใช้งาน&lt;/p&gt;
&lt;span class=&quot;font-weight-bold&quot;&gt;เอกสารอ้างอิง&lt;/span&gt;
&lt;p id=&quot;sec16_references&quot; class=&quot;indent&quot;&gt;&lt;/p&gt;

&lt;/div&gt;
&lt;/div&gt;
</pre>