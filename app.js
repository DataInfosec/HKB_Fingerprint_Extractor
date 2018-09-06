const fs = require('graceful-fs')
const ProgressBar = require('progress')
const mysql = require('mysql');
const _ = require('lodash')


var pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '*****',
    database: '*******'
})


let bar = new ProgressBar('  Writing files [:bar] :percent :etas', {
    total: 63029,
    incomplete: ' ',
    width: 50
})

let last_id = 0;
let fx = function (item) {
    if (item.finger_id == 1 || item.finger_id == 2 || item.finger_id == 6 || item.finger_id == 7 || item.finger_id == 8) {
        fs.writeFile(`./out/hkb_fingers2/${item.applicant_id}_${item.finger_id}.jp2`, item.image, 'buffer', err => {
            if (!err) {

            } else {
                console.error(err)
                console.log("last id", last_id)
                process.exit(1)
            }
        })
    }
    last_id = item.applicant_id
}


let fn = async function (callback) {
    while (true) {
        let rx = await new Promise((resolve, reject) => {
            pool.getConnection(function (err, connection) {

                let query = `SELECT applicant_id, finger_id, image \
                FROM applicant_fingerprints \
                WHERE applicant_id > ${last_id} ORDER BY applicant_id LIMIT 100`
                connection.query(query, function (error, results, fields) {
                    if (error) {
                        console.error("rejected", error)
                        reject(error)
                        process.exit(1)
                    } else {
                        results = results.filter(x => x.image != null)
                        for (let item of results) {
                            fx(item)
                        }
                        bar.tick(last_id - bar.curr);
                        resolve(results.length)
                    }
                    connection.release();
                });
            });
        })
        if (rx == 0) break;
    }

    pool.end(function (err) {
        if (!err) {
            console.log("last id", last_id)
            console.log("Pool closed")
        } else {
            console.log(err)
        }
    });
}

fn();