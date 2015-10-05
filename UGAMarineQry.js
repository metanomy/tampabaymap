var http = require('http');
var util = require('util'); //debug

if (process.argv.length < 3 || parseInt(lastTime) == 0)
{
	console.log("argument invalid\nusage: node UGAMarineQry.js [time in seconde]\n")
	return;
}

// global variable init
var lastTime = process.argv[2]
var urlAPI = "http://www.marinedebris.engr.uga.edu/mdtapp/getLoggedData.php?username=&password=&lists%5B%5D=22&from="+ (parseInt(new Date().getTime()) - parseInt(lastTime)) +"&to=" + parseInt(new Date().getTime()) + "&keywords="
var urltest = "http://www.marinedebris.engr.uga.edu/mdtapp/getLoggedData.php?username=&password=&lists%5B%5D=22&from=1422853200000&to=1425445200000&keywords=" 
var store = "marine_debris";
var layer = "uga_marine_debris";
var XMLHeader = "<wfs:Transaction service=\"WFS\" version=\"1.0.0\"\n"+
                  "xmlns:"+store+"=\"http://opengeo.org/#marine_debris\"\n"+
                  "xmlns:ogc=\"http://www.opengis.net/ogc\"\n"+
                  "xmlns:wfs=\"http://www.opengis.net/wfs\"\n"+
                  "xmlns:gml=\"http://www.opengis.net/gml\"\n"+
                  "xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\"\n"+
                  "xsi:schemaLocation=\"http://opengeo.org/#marine_debris https://dev.tampabaymap.org/geoserver/marine_debris/wfs?service=WFS&amp;version=1.0.0&amp;request=DescribeFeatureType&amp;typeName=marine_debris%3Auga_marine_debris http://www.opengis.net/wfs https://dev.tampabaymap.org/geoserver/schemas/wfs/1.0.0/WFS-basic.xsd\">";

//send request to UGA API
http.get(urlAPI, function(res) {
 var body = '';
  res.on('data', function(chunk) {
    body += chunk;
  });
  res.on('end', function() {
  //we got the result! let's loop on the result and send it
    var responseObject = JSON.parse(body);
    //updateWFS(responseObject.data[0]);
    responseObject.data.forEach(updateWFS)
    //responseObject.data.forEach(insertWFS)
    //responseObject.data.forEach(deleteAllWFS)
  });
}).on('error', function(e) {
  console.log("Got error: " + e.message);
}); 

function updateWFS(data)
{
    var Xml = "<wfs:Update typeName=\""+store+":"+layer+"\">\n"+
    		"<wfs:Property>\n"+
             "<wfs:Name>geom</wfs:Name>\n"+
          "<wfs:Value>\n"+
              "<gml:Point srsDimension=\"2\" srsName=\"urn:x-ogc:def:crs:EPSG:4326\">\n"+
                "<gml:coordinates decimal=\".\" cs=\",\" ts=\" \">"+data.latitude+","+data.longitude+"</gml:coordinates>\n"+
              "</gml:Point>\n"+
            "</wfs:Value>\n"+	
          "</wfs:Property>";

          	for(var index in data) { 
			   if (data.hasOwnProperty(index)) {
                if (index != "latitude" && index != "longitude" && index != "timestamp"  && index != "")
                        Xml += "<wfs:Property>\n"+
                                 "<wfs:Name>"+index+"</wfs:Name>"+
                                 "<wfs:Value>"+data[index]+"</wfs:Value>"+
                                 "</wfs:Property>";			   
			   if (index == "timestamp"){
			   			//20150203161706 >>2015-02-03-16:17:06
 						var formartTime = data[index].slice(0,4)+ "-" + data[index].slice(4,6) + "-" +data[index].slice(6,8) + "-" + data[index].slice(8,10)+":" + data[index].slice(10,12);
                        Xml += "<wfs:Property>\n"+
                                 "<wfs:Name>TimeStamp</wfs:Name>"+
                                 "<wfs:Value>"+formartTime+"</wfs:Value>"+
                                 "</wfs:Property>";		
                 }
			}
		}


        Xml += "<ogc:Filter>\n" +
                  "<PropertyIsEqualTo>\n" +
                    "<PropertyName>id</PropertyName>\n" +
                    "<Literal>"+data.id+"</Literal>\n" +
                  "</PropertyIsEqualTo>\n" +
                "</ogc:Filter>\n" +
              "</wfs:Update>\n" +
             "</wfs:Transaction>\n";
       //console.log((XMLHeader + Xml) + "\n--------------------------\n")
       send_data(XMLHeader + Xml)
}

function deleteAllWFS(data)
{
    var Xml = "<wfs:Delete typeName=\""+store+":"+layer+"\">\n";

        Xml += "<ogc:Filter>\n" +
                  "<PropertyIsEqualTo>\n" +
                    "<PropertyName>id</PropertyName>\n" +
                    "<Literal>"+data.id+"</Literal>\n" +
                  "</PropertyIsEqualTo>\n" +
                "</ogc:Filter>\n" +
              "</wfs:Delete>\n" +
             "</wfs:Transaction>\n";
 //       console.log((XMLHeader + Xml))
        send_data(XMLHeader + Xml)
}

function insertWFS(data)
{
    var Xml = "<wfs:Insert>"+
               "<"+store+":"+layer+">" +
                "<"+store+":geom>" +
                  "<gml:Point srsDimension=\"2\" srsName=\"urn:x-ogc:def:crs:EPSG:4326\">" +
                  "<gml:coordinates decimal=\".\" cs=\",\" ts=\" \">"+data.latitude+","+data.longitude+"</gml:coordinates>" +
                "</gml:Point>" +
                "</"+store+":geom>";
                
          	for(var index in data) { 
			   if (data.hasOwnProperty(index)) {
                if (index != "latitude" && index != "longitude" && index !="timestamp" && "longitude" && index != "")
                        Xml += "<"+store+":"+index+">"+data[index]+"</"+store+":"+index+">" 
			   	if (index == "timestamp")
			   	{
			   		var formartTime = data[index].slice(0,4)+ "-" + data[index].slice(4,6) + "-" +data[index].slice(6,8) + "-" + data[index].slice(8,10)+":" + data[index].slice(10,12);
                    Xml += "<"+store+":TimeStamp>"+formartTime+"</"+store+":TimeStamp>" 
			   	}
			}
			   
			}

			Xml += "</"+store+":"+layer+">" +
				"</wfs:Insert>" +
          		"</wfs:Transaction>";

	//        console.log((XMLHeader + Xml + "\n--------------------\n"))
        send_data(XMLHeader + Xml)
}

function send_data(Xml){

	var options = {
	  hostname: 'dev.tampabaymap.org',
	  path: '/geoserver/wfs',
	  method: 'POST',
	  headers: {
	    'Content-Type': 'text/xml',
	  }
	};

	var req = http.request(options, function(res) {
	  console.log('STATUS: ' + res.statusCode);
	  console.log('HEADERS: ' + JSON.stringify(res.headers));
	  res.setEncoding('utf8');
	  res.on('data', function (chunk) {
	    console.log('BODY: ' + chunk);
	  });
	  res.on('end', function() {
	    console.log('No more data in response.')
	  })
	});

	req.on('error', function(e) {
	  console.log('problem with request: ' + e.message);
	});

	// write data to request body
	req.write(Xml);
	req.end();
}

