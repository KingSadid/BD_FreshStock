// Post Elements
const postButton = document.getElementById("postBtn");
const nameInput = document.getElementById("name");
const dateInput = document.getElementById("birthdate");

//Get Elements
const getAllButton = document.getElementById("getAllBtn");
const idInput = document.getElementById("id");
const getOneButton = document.getElementById("getOneBtn");

postButton.addEventListener('click', async function () {
    const data = {
        name: nameInput.value,
        birthdate: dateInput.value
    };

    try {
        const response = await fetch('/test', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        const message = await response.text();
        document.getElementById('postSqlResult').innerText = message;

    } catch (error) {
        console.error('Error:', error);
        document.getElementById('postSqlResult').innerText = 'Error sending the form.';
    }
});

getAllButton.addEventListener('click', async function () {
    try {
        const response = await fetch('/test');
        const data = await response.json();

        const list = document.getElementById('getAllResult');
        list.innerHTML = '';

        if (data.length === 0) {
            list.innerHTML = '<li>There is no info</li>';
            return;
        }

        data.forEach(entry => {
            const li = document.createElement('li');
            li.textContent = JSON.stringify(entry);
            list.appendChild(li);
        });

    } catch (error) {
        console.error('Error getting data:', error);
        document.getElementById('getAllResult').innerHTML = '<li>Error obtaining info.</li>';
    }
});

getOneButton.addEventListener('click', async function () {
    const id = idInput.value;
    try {
        const response = await fetch(`/test/${id}`);
        const data = await response.json();
        const resultContainer = document.getElementById('getOneResult');
        resultContainer.innerHTML = '';

        if (!data || Object.keys(data).length === 0) {
            resultContainer.innerHTML = '<li>There is no info</li>';
            return;
        }

        Object.entries(data).forEach(([key, value]) => {
            const li = document.createElement('li');
            li.textContent = `${key}: ${value}`;
            resultContainer.appendChild(li);
        });

    } catch (error) {
        console.error('Error getting data:', error);
        document.getElementById('getOneResult').innerHTML = '<li>Error</li>';
    }
});