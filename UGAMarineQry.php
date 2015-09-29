<?php
if (intval($argv[1]) == 0)
{
        echo "argument invalid\nusage: php5 UGAMarineQry.php [time in seconde]\n";
        exit;
}

$now = time();
$before = time() - intval($argv[1]);

$APIUrl = "http://www.marinedebris.engr.uga.edu/mdtapp/getLoggedData.php?username=&password=&lists%5B%5D=22&from=$now&to=$before&keywords="; 
$POSTUrl = "http://localhost:8080/geoserver/wfs";
$openplans = "spearfish";
$store = "sf";
$layer = "uga_marine_debris";
$XMLHeader = "<wfs:Transaction service=\"WFS\" version=\"1.0.0\"
                  xmlns:$store=\"http://www.openplans.org/$openplans\"
                  xmlns:ogc=\"http://www.opengis.net/ogc\"
                  xmlns:wfs=\"http://www.opengis.net/wfs\"
                  xmlns:gml=\"http://www.opengis.net/gml\"
                  xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\"
                  xsi:schemaLocation=\"http://www.opengis.net/wfs http://schemas.opengis.net/wfs/1.0.0/WFS-transaction.xsd\">";


$ch = curl_init(); 
// set url 
curl_setopt($ch, CURLOPT_URL, $APIUrl); 
//return the transfer as a string 
curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1); 
// $API contains the API string 
$API = curl_exec($ch); 
//print_r($API);        

$tab = json_decode($API, true);
$ch = curl_init($POSTUrl); 
curl_setopt($ch, CURLOPT_HTTPHEADER, array('Content-Type: text/xml'));
curl_setopt($ch, CURLOPT_POST, 1);
update($API,$ch, $XMLHeader);
//insert($API,$ch, $XMLHeader);

function update($API,$ch, $XMLHeader)
{
        global $layer, $store;
        $update = "<wfs:Update typeName=\"$store:$layer\">";
        $tab = json_decode($API, true);
        foreach ($tab["data"] as $value) {
                //echo $XMLHeader.UpdateTabToXml($value). "\n\n----------------------------------------------\n\n";
                curl_setopt($ch, CURLOPT_POSTFIELDS, $XMLHeader.$update.UpdateTabToXml($value));
                curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
                $response = curl_exec($ch);
                echo "$response\n\n-----------------------------------------------\n\n";
        }
}

function insert($API,$ch, $XMLHeader)
{

        global $layer, $store;
        $tab = json_decode($API, true);
        foreach ($tab["data"] as $value) {
                //echo $XMLHeader.insertTabToXml($value). "\n\n----------------------------------------------\n\n";
                curl_setopt($ch, CURLOPT_POSTFIELDS, $XMLHeader.insertTabToXml($value));
                curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
                $response = curl_exec($ch);
                echo "$response\n\n-----------------------------------------------\n\n";
        }
}



function UpdateTabToXml($data)
{

        $Xml =  "<wfs:Property>
                     <wfs:Name>the_geom</wfs:Name>
                  <wfs:Value>
                      <gml:Point srsDimension=\"2\" srsName=\"urn:x-ogc:def:crs:EPSG:4326\">
                        <gml:coordinates decimal=\".\" cs=\",\" ts=\" \">".$data["latitude"].",".$data["longitude"]."</gml:coordinates>
                      </gml:Point>
                    </wfs:Value>
                  </wfs:Property>";

                //TO UNCOMMENT
        // foreach ($data as $key => $value) {
        //         if ($key != "latitude" && $key != "longitude" && $key != "")
        //                 $Xml .= "<wfs:Property>
        //                          <wfs:Name>$key</wfs:Name>
        //                          <wfs:Value>$value</wfs:Value>
        //                          </wfs:Property>";
        // }

        $Xml .= "<ogc:Filter>
                  <PropertyIsEqualTo>
                    <PropertyName>id</PropertyName>
                    <Literal>".$data["id"]."</Literal>
                  </PropertyIsEqualTo>
                </ogc:Filter>
              </wfs:Update>
             </wfs:Transaction>" ;

        return $Xml;
}


function insertTabToXml($data)
{
  global $layer, $store;
  $Xml = "<wfs:Insert>
              <$store:$layer>
                <$store:the_geom>
                  <gml:Point srsDimension=\"2\" srsName=\"urn:x-ogc:def:crs:EPSG:4326\">
                  <gml:coordinates decimal=\".\" cs=\",\" ts=\" \">".$data["latitude"].",".$data["longitude"]."</gml:coordinates>
                </gml:Point>
                </$store:the_geom>
                <$store:id>".$data["id"]."</$store:id>
              </$store:$layer>
            </wfs:Insert>
          </wfs:Transaction>";
        return $Xml;
}

?>