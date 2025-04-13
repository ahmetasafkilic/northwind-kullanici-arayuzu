const express = require('express');
const sql = require('mssql');
const cors = require('cors');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

const config = {
  user: 'sa',    //Buraya kendi kullanıcı adınızı yazınız.
  password: 'Asaf1234!',    //Buraya da şifrenizi yazınız.
  server: 'localhost',
  database: 'Northwind',
  options: {
    trustServerCertificate: true
  }
};

// 1. Müşteri siparişleri
app.get('/orders-by-customer', async (req, res) => {
  const { name } = req.query;
  try {
    await sql.connect(config);
    const result = await sql.query`
      SELECT o.OrderID, o.OrderDate, p.ProductName, od.Quantity
      FROM Customers c
      JOIN Orders o ON c.CustomerID = o.CustomerID
      JOIN [Order Details] od ON o.OrderID = od.OrderID
      JOIN Products p ON od.ProductID = p.ProductID
      WHERE c.CompanyName LIKE ${'%' + name + '%'}
    `;
    res.json(result.recordset);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// 2. Top 5 müşteri
app.get('/top-customers', async (_, res) => {
  try {
    await sql.connect(config);
    const result = await sql.query(`
      SELECT TOP 5 c.CompanyName, COUNT(*) AS SiparisSayisi
      FROM Customers c
      JOIN Orders o ON c.CustomerID = o.CustomerID
      GROUP BY c.CompanyName
      ORDER BY SiparisSayisi DESC
    `);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// 3. Çalışan satış özeti
app.get('/employee-sales-summary', async (req, res) => {
  const { name } = req.query;
  try {
    await sql.connect(config);
    const result = await sql.query`
      SELECT e.FirstName + ' ' + e.LastName AS Employee, COUNT(o.OrderID) AS Orders,
             COUNT(DISTINCT o.ShipCountry) AS Countries
      FROM Employees e
      JOIN Orders o ON e.EmployeeID = o.EmployeeID
      WHERE e.FirstName + ' ' + e.LastName LIKE ${'%' + name + '%'}
      GROUP BY e.FirstName, e.LastName
    `;
    res.json(result.recordset);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// 4. Stokta olmayan ürünler
app.get('/out-of-stock-products', async (_, res) => {
  try {
    await sql.connect(config);
    const result = await sql.query(`
      SELECT p.ProductName, SUM(od.Quantity) AS TotalOrdered
      FROM Products p
      JOIN [Order Details] od ON p.ProductID = od.ProductID
      WHERE p.UnitsInStock = 0
      GROUP BY p.ProductName
      ORDER BY TotalOrdered DESC
    `);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// 5. Yıla göre satış
app.get('/sales-by-year', async (req, res) => {
  const { year } = req.query;
  try {
    await sql.connect(config);
    const result = await sql.query`
      SELECT SUM(od.UnitPrice * od.Quantity) AS TotalSales
      FROM Orders o
      JOIN [Order Details] od ON o.OrderID = od.OrderID
      WHERE YEAR(o.OrderDate) = ${year}
    `;
    res.json(result.recordset[0]);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.listen(port, () => {
  console.log(`✅ Sunucu http://localhost:${port} adresinde çalışıyor.`);
});
