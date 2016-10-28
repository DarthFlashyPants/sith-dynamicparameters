var pg = require('pg');
var fs = require('fs'),
    xml2js = require('xml2js');
//database which contains 'Category' table postgresL//username:password@server:port/database
var pgConString = "postgres://user:pass@foo.compute-1.amazonaws.com:5432/dvdrental";

// connect
pg.connect(pgConString, function(err, client) {
    if (err) {
        console.log(err);
    }

    // what to do when a notification comes in that we care about
    client.on('notification', function(msg) {
        // Payload: [Table which threw a notification,
        //          The Type of Action (Update, Delete, Insert ),
        //          For Deletes and Inserts : The value to be deleted / modified. For Updates, the "old" value
        //          For Updates, the "new" value to replace the "old" one with  ]
        payload = msg.payload.toString().split(',');
        action = payload[1];
        // someone fired an UPDATE against the table we care about
        if (action == 'UPDATE') {
            // Updates pass two pieces of info - the old and new value of a category.
            // We need to pass both  to the function which updates XML
            updateTWB(action, payload.splice(2, 2));
        } else if (action == 'DELETE') {
            // Pass in the name of the category to be deleted from the parameters collection
            updateTWB(action, payload[2]);
        } else if (action == 'INSERT') {
            // Pass in the name of the category to be INSERTED to the parameters collection
            updateTWB(action, payload[2]);
        }
    });

    // What notification shoud we listen for?
    var query = client.query("LISTEN watchers");
});

function updateTWB(action, actionValues) {
    console.log('Updating TWB. Data:', actionValues);

    var parser = new xml2js.Parser();

    // Open TWB from Tableau via TableauFS
    // /<tableau mount point>/Site/Project/Workbook.twb
    fs.readFile('/mnt/darth-server/Default/Default/DVD\ Rental.twb', function(err, data) {
        if (err) {
            throw err;
        }

        // parse TWB XML into a JS object
        parser.parseString(data, function(err, result) {
            if (err) {
                throw err;
            }

            // This represents the  "Category Name Parameter" in the workbook:
            // Start at the the first column of the first data source.
            var members = result.workbook.datasources[0].datasource[0].column[0].members[0].member;

            switch (action) {
                case 'DELETE':
                    console.log('Deleting.');
                    for (var member in members) {
                        if (members.hasOwnProperty(member)) {
                            var regexPattern = new RegExp('[A-Z,a-z,\-]+');

                            // Search through parameters. Look for a value which matches the value to be deleted.
                            currentMember = regexPattern.exec(JSON.stringify(members[member].$.value.toString()));
                            if (currentMember == actionValues) {
                                console.log('Hit. Removing', currentMember);
                                members.splice(members.indexOf(members[member]), 1); //remove the member
                            }
                        }
                    }
                    break;
                case 'INSERT':
                    console.log('Inserting.');
                    newMember = clone(members[0]);
                    newMember.$.value = '\"' + actionValues + '\"';
                    members.push(newMember);
                    break;
                case 'UPDATE':
                    console.log('Upadating.');
                    for (var member in members) {
                        if (members.hasOwnProperty(member)) {
                            var regexPattern = new RegExp('[A-Z,a-z,\-]+');

                            // Find the "old" member in the collections of memmbers
                            // Then, change it to the "new" value.
                            currentMember = regexPattern.exec(JSON.stringify(members[member].$.value.toString()));
                            if (currentMember == actionValues[0]) {
                                console.log('Hit. Updating', currentMember);
                                members[member].$.value = '\"' + actionValues[1] + '\"';
                            }
                        }
                    }
                    break;
            }
            // Make a copy of any existing member
            // Change the value of said clone
            //Add to members collection
            console.log('Done');

            // Save back to XML from JS object, then write to disk
            var builder = new xml2js.Builder();
            var xml = builder.buildObject(result);

            fs.writeFile('/mnt/darth-server/Default/Default/DVD\ Rental.twb', xml, function(err) {
                if (err) {
                    throw err;
                }
            });
        });
    });
}

// Helper function stolen from StackExchane with clones an object.
// This helps me with ByRef when I sometimes need ByVal
function clone(obj) {
    if (obj == null || typeof obj != 'object') {
        return obj;
    }

    var temp = new obj.constructor();

    for (var key in obj) temp[key] = clone(obj[key])

    return temp;
}
