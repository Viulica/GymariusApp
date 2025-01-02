class Workout {
    constructor(id, name, date, exercises, duration = 0, linkedNotes = []) {
        this.id = id;
        this.name = name;
        this.date = date;
        this.exercises = exercises;
        this.duration = duration;
        this.linkedNotes = linkedNotes; 
    }
}

export default Workout;
