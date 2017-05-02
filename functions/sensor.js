'use strict';

const db = require('../models/Connection');

function getDistanceFromLatLonInKm(lat1,lon1,lat2,lon2) {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2-lat1);  // deg2rad below
  const dLon = deg2rad(lon2-lon1); 
  
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2); 

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  const d = R * c; // Distance in km
  return d;
}

function deg2rad(deg) {
  return deg * (Math.PI/180);
}

function randomIntFromInterval(min,max)
{
    return Math.floor(Math.random()*(max-min+1)+min);
}

exports.getSensorAlgorithm = (lat, lng, service, price) => 
	
	new Promise((resolve,reject) => {

		let sensors =[];
		let sensors_final =[];
		let sensor_chosen;
		let high_rank = -1;
		price = parseFloat(price);

		const cypher = "MATCH (s:Service {title:{service}})-[:BELONGS_TO]->(c:Category) "
					+"MATCH (c)<-[:BELONGS_TO]-(p:Sensor)-[r:IS_IN]->(g:Group) "
					+"WHERE r.price <= {price} "
					+"RETURN p, (r.sum/r.qty)";

		db.cypher({
		    query: cypher,
		    params: {
		        price: price,
	            category: category											
		    },
		    lean: true
		}, (err, results) =>{
			if (err) 
		    	reject({ status: 500, message: 'Internal Server Error !' });
		    else{
		    	results.forEach(function (obj) {
		            let p = obj['p'];
		            const rank = obj['(r.sum/r.qty)'];
		            p.rank = rank;

		            sensors.push(p);

		            if(rank > high_rank)
		            	high_rank = rank;
		            }
		        });

		        sensors.forEach(function (sensor) {
		            if(getDistanceFromLatLonInKm(lat, lng, p.lat, p.lng) < 1.5 && sensor.rank == high_rank){
		            	sensors_final.push(sensor);
		            }
		        });

		        if(sensors_final.length > 1){
		        	const position = randomIntFromInterval(0, (sensors_final.length-1));
		        	sensor_chosen = sensors_final[position];

		        }else
		        	sensor_chosen = sensors_final[0];

				resolve({ status: 201, sensor: sensor_chosen });
		    }
		    
		});

	});