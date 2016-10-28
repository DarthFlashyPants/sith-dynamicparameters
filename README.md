# Sith Dynamic Parameters

### Watch a database table named "Category" in PostgreSQL and use the value in Category.name to update the parameters collection of a Tableau Workbook


sith-dynamicparameters assumes:

- You've got a linux box running with tableaufs installed and configured (https://github.com/tfoldi/fuse-tableaufs)
- You are currently able to browse the workgroup database of Tableau Server via mount created by tableaufs on your linux machine
- You have the DVD Rental sample database of PostgreSQL installed (http://www.postgresqltutorial.com/postgresql-sample-database/)
- You've published "DVD Rental.twb" to the Default project of Tableau's Default Site.


###Setup
```
npm install
```
1. In the DVD Rental database, create a function and trigger to execute it. See SithSQL.sql for the SQL to leverage.
2. Update index.js, changing the connection string to your DVD Rental database server as necessary.

###Execute
```
node index.js
```             
Note: Because of Tableau Server's caching behavior, you should expect a minute-or-more gap between an update to the XML in "DVD Rental.twb" and when it becomes visible in Tableau Server.
