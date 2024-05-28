class Exercise {
    constructor(id, name, type, bodyPart, sets=[]) {
        this.id = id;
        this.name = name;
        this.type = type;
        this.bodyPart = bodyPart;
        this.sets = sets;
    }

    addSet(set) {
        this.sets.push(set);
    }

    getNumberOfSets() {
        return this.sets.length;
    }

}

export default Exercise;
