require('dotenv').config();

const { Firestore } = require('@google-cloud/firestore');

const db = new Firestore();
const subjectsCollection = db.collection('subjects');


async function getSubjectById(id) {
    const doc = await subjectsCollection.doc(String(id)).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() };
}

async function getSubjectByName(name) {
    const snapshot = await db.collection('subjects').where('Name', '==', name).limit(1).get();
    if (snapshot.empty) return null;
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() };
}


async function getSubjects(queryParams) {
    let query = subjectsCollection;
    if (queryParams.name) query = query.where('Name', '==', queryParams.name);
    if (queryParams.year) query = query.where('Year', '==', parseInt(queryParams.year));
    if (queryParams.semester) query = query.where('Semester', '==', parseInt(queryParams.semester));

    const snapshot = await query.get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

async function addSubject(subject) {
    const existingDoc = await db.collection('subjects')
        .where('Name', '==', subject.Name)
        .get();

    if (!existingDoc.empty) {
        throw new Error('Subject with this name already exists.');
    }
    const docRef = await subjectsCollection.add(subject);
    return docRef.id;
}

async function updateSubject(id, data) {
    const docRef = subjectsCollection.doc(String(id));
    const doc = await docRef.get();

    if (!doc.exists) return false;

    if (data.Name && data.Name !== doc.data().Name) {
        const duplicate = await subjectsCollection
            .where('Name', '==', data.Name)
            .get();

        const conflict = !duplicate.empty && duplicate.docs.some(d => d.id !== id);
        if (conflict) {
            throw new Error('Another subject with this name already exists.');
        }
    }

    await docRef.update(data);
    return true;
}


async function deleteSubject(id) {
    const docRef = subjectsCollection.doc(String(id));
    const doc = await docRef.get();
    if (!doc.exists) return false;

    await docRef.delete();
    return true;
}

module.exports = {
    getSubjectById,
    getSubjectByName,
    getSubjects,
    addSubject,
    updateSubject,
    deleteSubject
};