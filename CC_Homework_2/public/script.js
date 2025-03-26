const API_BASE = "http://localhost:19000/api";
let token = localStorage.getItem("token");

async function signUp() {
    const name = document.getElementById("signup-username").value;
    const password = document.getElementById("signup-password").value;

    if (!name || !password) {
        alert("Please enter a username and password to sign up.");
        return;
    }

    try {
        const res = await fetch(`${API_BASE}/auth/signup`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, password })
        });

        const data = await res.json();
        if (res.ok) {
            alert("Sign-up successful! You can now log in.");
        } else {
            alert(data.error || "Sign-up failed.");
        }
    } catch (error) {
        alert("Error connecting to the server.");
    }
}

async function login() {
    const name = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    if (!name || !password) {
        alert("Please enter both username and password.");
        return;
    }

    try {
        const res = await fetch(`${API_BASE}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, password })
        });

        const data = await res.json();
        if (res.ok) {
            localStorage.setItem("token", data.token);
            token = data.token;
            alert("Login successful!");
            updateUI();
        } else {
            alert(data.error || "Login failed.");
        }
    } catch (error) {
        alert("Error connecting to the server.");
    }
}

function logout() {
    localStorage.removeItem("token");
    token = null;
    alert("Logged out");
    updateUI();
}

async function getWeather() {
    const city = document.getElementById("cityInput").value.trim();
    if (!city) {
        alert("Please enter a city name.");
        return;
    }

    const res = await fetch(`${API_BASE}/weather?city=${encodeURIComponent(city)}`);
    const data = await res.json();

    if (!res.ok) {
        alert(`Error (${res.status}): ${data.error}`);
    } else {
        document.getElementById("weather").innerText = `City: ${data.city}\nTemperature: ${data.temperature}°C\nDescription: ${data.description}`;
    }
}

async function getRandom() {
    const min = document.getElementById("minInput").value;
    const max = document.getElementById("maxInput").value;

    if (!min || !max) {
        alert("Please enter both min and max values.");
        return;
    }

    const res = await fetch(`${API_BASE}/random?min=${min}&max=${max}`);
    const data = await res.json();

    if (!res.ok) {
        alert(`Error (${res.status}): ${data.error}`);
    } else {
        document.getElementById("random").innerText = `Random Number: ${data.randomNumber}`;
    }
}

let currentOperation = "GET";

function setOperation(op) {
    currentOperation = op;
    
    document.getElementById("getFields").style.display = op === "GET" ? "block" : "none";
    document.getElementById("postUpdateFields").style.display = (op === "POST" || op === "UPDATE") ? "block" : "none";
    document.getElementById("deleteFields").style.display = op === "DELETE" ? "block" : "none";
}

function displaySubjects(subjects) {
    const subjectsContainer = document.getElementById("subjects");
    subjectsContainer.innerHTML = ""; // Clear previous content

    if (!Array.isArray(subjects) || subjects.length === 0) {
        subjectsContainer.innerHTML = "<p>No subjects available.</p>";
        return;
    }

    if (subjects.length === 1) {
        const subject = subjects[0];
        subjectsContainer.innerHTML = `
                <h3>Subject Name:<u>${subject.Name}</u> (ID: ${subject.ID})</h3>
                <p><strong><i>Credits</i>:</strong> ${subject.Credits}</p>
                <p><strong><i>Year</i>:</strong> ${subject.Year}</p>
                <p><strong><i>Semester</i>:</strong> ${subject.Semester}</p>
                <p><strong><i>Description</i>:</strong> ${subject.Description}</p>
                <hr>
            `;
    } else {
        subjects.forEach(subject => {
            const subjectDiv = document.createElement("div");
            subjectDiv.innerHTML = `
                <h3>Subject Name:<u>${subject.Name}</u> (ID: ${subject.ID})</h3>
                <p><strong><i>Credits</i>:</strong> ${subject.Credits}</p>
                <p><strong><i>Year</i>:</strong> ${subject.Year}</p>
                <p><strong><i>Semester</i>:</strong> ${subject.Semester}</p>
                <p><strong><i>Description</i>:</strong> ${subject.Description}</p>
                <hr>
            `;
            subjectsContainer.appendChild(subjectDiv);
        });
    }
}

async function handleSubjectsRequest() {
    if (!token) {
        alert("You must log in to perform this action!");
        return;
    }

    try {
        let url = `${API_BASE}/subjects`;
        let options = { method: "GET", headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" } };
        
        if (currentOperation === "GET") {
            const params = new URLSearchParams();
            const name = document.getElementById("subjectName").value.trim();
            const year = document.getElementById("subjectYear").value.trim();
            const semester = document.getElementById("subjectSemester").value.trim();

            if (name) params.append("name", name);
            if (year) params.append("year", year);
            if (semester) params.append("semester", semester);

            url += params.toString() ? `?${params.toString()}` : "";

        } else if (currentOperation === "POST" || currentOperation === "UPDATE") {
            const subject = {
                Name: document.getElementById("subjectNamePost").value.trim(),
                Credits: document.getElementById("subjectCredits").value.trim(),
                Year: document.getElementById("subjectYearPost").value.trim(),
                Semester: document.getElementById("subjectSemesterPost").value.trim(),
                Description: document.getElementById("subjectDesc").value.trim(),
            };

            if (currentOperation === "UPDATE") {
                const id = document.getElementById("subjectID").value.trim();
                if (!id) return alert("ID is required for updating a subject.");
                url += `/${id}`;
                options.method = "PUT";
            } else {
                options.method = "POST";
            }

            options.body = JSON.stringify(subject);

        } else if (currentOperation === "DELETE") {
            const id = document.getElementById("deleteSubjectID").value.trim();
            if (!id) return alert("ID is required for deleting a subject.");
            url += `/${id}`;
            options.method = "DELETE";
        }

        const res = await fetch(url, options);
        const data = await res.json();

        if (!res.ok) {
            alert(`Error (${res.status}): ${data.error || "Request failed"}`);
        } else {
            if (currentOperation == "GET") {
                displaySubjects(data);
            }
            else document.getElementById("subjects").innerText = JSON.stringify(data, null, 2);
        }
    } catch (error) {
        alert("Error connecting to the server.");
    }
}

function updateUI() {
    if (token) {
        document.getElementById("loginBtn").style.display = "none";
        document.getElementById("logoutBtn").style.display = "block";
    } else {
        document.getElementById("loginBtn").style.display = "block";
        document.getElementById("logoutBtn").style.display = "none";
    }
}

document.getElementById("signupBtn").addEventListener("click", signUp);
document.getElementById("loginBtn").addEventListener("click", login);
document.getElementById("logoutBtn").addEventListener("click", logout);
document.getElementById("weatherBtn").addEventListener("click", getWeather);
document.getElementById("randomBtn").addEventListener("click", getRandom);
document.getElementById("getSubjectsBtn").addEventListener("click", () => setOperation("GET"));
document.getElementById("postSubjectsBtn").addEventListener("click", () => setOperation("POST"));
document.getElementById("updateSubjectsBtn").addEventListener("click", () => setOperation("UPDATE"));
document.getElementById("deleteSubjectsBtn").addEventListener("click", () => setOperation("DELETE"));
document.getElementById("submitBtn").addEventListener("click", handleSubjectsRequest);

updateUI();
