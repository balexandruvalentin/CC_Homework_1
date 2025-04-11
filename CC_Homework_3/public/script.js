const API_BASE = "http://localhost:19000/api";

let currentOperation = "GET";

function setOperation(op) {
    currentOperation = op;
    
    document.getElementById("getFields").style.display = op === "GET" ? "block" : "none";
    document.getElementById("postUpdateFields").style.display = (op === "POST" || op === "UPDATE") ? "block" : "none";
    document.getElementById("deleteFields").style.display = op === "DELETE" ? "block" : "none";
    document.getElementById("imageOptions").style.display = op === "UPDATE" ? "block" : "none";
}

function displaySubjects(subjects) {
    const subjectsContainer = document.getElementById("subjects");
    subjectsContainer.innerHTML = "";

    if (!Array.isArray(subjects) || subjects.length === 0) {
        subjectsContainer.innerHTML = "<p>No subjects available.</p>";
        return;
    }

    if (subjects.length === 1) {
        const subject = subjects[0];
        subjectsContainer.innerHTML = `
                <h3>Subject Name:<u>${subject.Name}</u></h3>
                <img src="${subject.imageUrl}" alt="${subject.Name}" width="200" height="auto">
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
                <h3>Subject Name:<u>${subject.Name}</u></h3>
                <img src="${subject.imageUrl}" alt="${subject.Name}" width="200" height="auto">
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
    try {
        let url = `${API_BASE}/subjects`;
        let options = {
            method: "GET"
        };   
        
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
            const formData = new FormData();
        
            formData.append("Name", document.getElementById("subjectNamePost").value.trim());
            formData.append("Credits", document.getElementById("subjectCredits").value.trim());
            formData.append("Year", document.getElementById("subjectYearPost").value.trim());
            formData.append("Semester", document.getElementById("subjectSemesterPost").value.trim());
            formData.append("Description", document.getElementById("subjectDesc").value.trim());
        
            const imageFile = document.getElementById("subjectImage").files[0];
            if (imageFile) {
                formData.append("image", imageFile);
            }
        
            if (currentOperation === "UPDATE") {
                const name = document.getElementById("subjectNamePost").value.trim();
                if (!name) return alert("Name is required for updating a subject.");
                url += `/name/${name}`;
                options.method = "PUT";
            } else {
                options.method = "POST";
            }
        
            options.body = formData;
        } else if (currentOperation === "DELETE") {
            const name = document.getElementById("deleteSubjectName").value.trim();
            if (!name) return alert("Name is required for deleting a subject.");
            url += `/name/${name}`;
            options.method = "DELETE";
        }

        const res = await fetch(url, options);
        const data = await res.json();

        const subjectsContainer = document.getElementById("subjects");
        subjectsContainer.innerHTML = "";

        if (!res.ok) {
            alert(`Error (${res.status}): ${data.error || "Request failed"}`);
        } else {
            if (currentOperation === "GET") {
                displaySubjects(data);
            } else if (currentOperation === "POST") {
                subjectsContainer.innerHTML = `
                    <p style="color: green; font-weight: bold;">
                        Subject successfully created!
                    </p>
                `;
            } else if (currentOperation === "PUT" || currentOperation === "DELETE") {
                subjects.innerHTML = `
                    <p style="color: green; font-weight: bold;">
                        ${data.message}
                    </p>
                `;
            } else {
                subjectsContainer.innerHTML = `
                    <pre>${JSON.stringify(data, null, 2)}</pre>
                `;
            }
        }
    } catch (error) {
        alert(error.message);
    }
}


document.getElementById("getSubjectsBtn").addEventListener("click", () => setOperation("GET"));
document.getElementById("postSubjectsBtn").addEventListener("click", () => setOperation("POST"));
document.getElementById("updateSubjectsBtn").addEventListener("click", () => setOperation("UPDATE"));
document.getElementById("deleteSubjectsBtn").addEventListener("click", () => setOperation("DELETE"));
document.getElementById("submitBtn").addEventListener("click", handleSubjectsRequest);