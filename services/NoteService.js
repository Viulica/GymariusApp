import AsyncStorage from '@react-native-async-storage/async-storage';

class NoteService {
    static storageKey = 'notes';

    static async getNotes() {
        const json = await AsyncStorage.getItem(this.storageKey);
        return json ? JSON.parse(json) : [];
    }

    static async getNoteById(id) {
        const notes = await this.getNotes();
        return notes.find(note => note.id === id);
    }

    static async addNote(note) {
        const notes = await this.getNotes();
        notes.push(note);
        await AsyncStorage.setItem(this.storageKey, JSON.stringify(notes));
    }

    static async deleteNoteById(id) {
        const notes = await this.getNotes();
        const updatedNotes = notes.filter(note => note.id !== id);
        await AsyncStorage.setItem(this.storageKey, JSON.stringify(updatedNotes));
    }
}

export default NoteService;
