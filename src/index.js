const express = require('express');
const { v4: uuidv4 } = require("uuid")

const app = express();

const customers = [];

app.use(express.json())

// Middlewares
function verifyIfExistsAccountCPF(request, response, next) {
    const { cpf } = request.headers;
    
    const customer = customers.find(customer => customer.cpf === cpf);

    if (!customer) {
        return response.status(400).json({ error: "Customer not found!" })
    }

    request.customer = customer;

    return next(); 
}

function getBalance(statement) {

    console.log('statement dentro do get balance', statement);

    const balance = statement.reduce((acc, operation) => {
        if (operation.type === "credit") {
            return acc + operation.amount;
        } else if (operation.type === "debit") {
            return acc - operation.amount;
        }
    }, 0)

    return balance;
}

app.post("/account", (request, response) => {

    const { cpf, name } = request.body; 

    const customerAlreadyExists = customers.some(customer => customer.cpf === cpf);

    if (customerAlreadyExists) {
        return response.status(400).json({ error: "Customer already exists!" })
    }

    console.log('customerAlreadyExists xxx', customerAlreadyExists);

    customers.push({ 
        id: uuidv4(),
        cpf,
        name,
        statement: []
    })

    return response.status(201).send()

})

// app.use(verifyIfExistsAccountCPF) tudo o que vier abaixo começa a usar esse middleware.

app.get("/statement", verifyIfExistsAccountCPF, (request, response) => {

    const { customer } = request;

    return response.status(200).json(customer.statement)

})

app.post("/deposit", verifyIfExistsAccountCPF, (request, response) => {

    const { description, amount } = request.body;

    const { customer } = request;

    const statementOperation = {
        description,
        amount,
        created_at: new Date(),
        type: "credit"
    }

    customer.statement.push(statementOperation);

    return response.status(201).send();
})

app.post("/withdraw", verifyIfExistsAccountCPF, (request, response) => {

    const { amount } = request.body;

    const { customer } = request;

    const balance = getBalance(customer.statement)

    if (balance < amount) {
        return response.status(400).json({ error: "Insufficiente funds!" });
    }

    const statementOperation = {
        amount,
        created_at: new Date(),
        type: "debit"
    }

    customer.statement.push(statementOperation);

    return response.status(201).send();

})

app.get("/statement/date", verifyIfExistsAccountCPF, (request, response) => {
    
    const { date } = request.query; 

    const { customer } = request;

    const dateFormat = new Date(date + " 00:00");

    const statement = customer.statement.filter(
        statement => statement.created_at.toDateString() === new Date(dateFormat).toDateString()
    );

    return response.status(200).json(statement);
})

app.put("/account", verifyIfExistsAccountCPF, (request, response) => {
    const { name } = request.body;

    const { customer } = request;
    
    customer.name = name;

    return response.status(201).send();
})

app.get("/account", verifyIfExistsAccountCPF, (request, response) => {
    const { customer } = request;

    return response.status(200).json(customer)
})

app.delete("/account", verifyIfExistsAccountCPF, (request, response) => {
    const { customer } = request;

    customers.splice(customer, 1);

    return response.status(200).json(customers);
})

app.get("/customers-all", (request, response) => {

    return response.status(200).json(customers)

})

app.get("/balance", verifyIfExistsAccountCPF, (request, response) => {

    const { customer } = request;

    const balance = getBalance(customer.statement);

    return response.status(200).json(balance);

})

app.listen(3333);
