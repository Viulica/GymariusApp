import AsyncStorage from "@react-native-async-storage/async-storage";

class WorkoutService {
    static storageKey = 'workoutData';

    static async getWorkouts() {
        const data = await this.getData();
        return data ? data.workouts : [];
    }

    static async getExercises() {
        const data = await this.getData();
        if (!data) {
            // Ako nema podataka, inicijaliziraj ih
            const initialData = await this.initializeAppData();
            return initialData.exercises;
        }
        return data.exercises;
    }

    static async getData() {
        const json = await AsyncStorage.getItem(this.storageKey);
        return json ? JSON.parse(json) : null;
    }

    static async addWorkout(workout) {
        const data = await this.getData();
        if (data && data.workouts) {
            data.workouts.push(workout);
            await AsyncStorage.setItem(this.storageKey, JSON.stringify(data));
        } else {
            console.error("Failed to retrieve data for updating");
        }
    }

    static async initializeAppData() {
        
        const currentData = await AsyncStorage.getItem(this.storageKey);
        if (!currentData) {
            const initialData = {
                exercises: [
                    // Chest exercises
                    { id: 1, name: "Bench Press", type: "Compound", bodyPart: "Chest" },
                    { id: 2, name: "Incline Bench Press", type: "Compound", bodyPart: "Chest" },
                    { id: 3, name: "Dumbbell Flyes", type: "Isolation", bodyPart: "Chest" },
                    { id: 4, name: "Push-Ups", type: "Compound", bodyPart: "Chest" },
                    
                    // Back exercises
                    { id: 5, name: "Pull-Ups", type: "Compound", bodyPart: "Back" },
                    { id: 6, name: "Barbell Rows", type: "Compound", bodyPart: "Back" },
                    { id: 7, name: "Lat Pulldown", type: "Compound", bodyPart: "Back" },
                    { id: 8, name: "Deadlift", type: "Compound", bodyPart: "Back" },
                    
                    // Legs exercises
                    { id: 9, name: "Squats", type: "Compound", bodyPart: "Legs" },
                    { id: 10, name: "Leg Press", type: "Compound", bodyPart: "Legs" },
                    { id: 11, name: "Romanian Deadlift", type: "Compound", bodyPart: "Legs" },
                    { id: 12, name: "Calf Raises", type: "Isolation", bodyPart: "Legs" },
                    
                    // Arms exercises
                    { id: 13, name: "Bicep Curls", type: "Isolation", bodyPart: "Arms" },
                    { id: 14, name: "Tricep Extensions", type: "Isolation", bodyPart: "Arms" },
                    { id: 15, name: "Hammer Curls", type: "Isolation", bodyPart: "Arms" },
                    { id: 16, name: "Skull Crushers", type: "Isolation", bodyPart: "Arms" },
                    
                    // Shoulders exercises
                    { id: 17, name: "Military Press", type: "Compound", bodyPart: "Shoulders" },
                    { id: 18, name: "Lateral Raises", type: "Isolation", bodyPart: "Shoulders" },
                    { id: 19, name: "Front Raises", type: "Isolation", bodyPart: "Shoulders" },
                    { id: 20, name: "Face Pulls", type: "Isolation", bodyPart: "Shoulders" }
                ],
                workouts: []
            };
            await AsyncStorage.setItem(this.storageKey, JSON.stringify(initialData));
            return initialData;
        }
        return JSON.parse(currentData);
    }

    static async addExercise(exercise) {
        const data = await this.getData();
        if (data && data.exercises) {
            const maxId = data.exercises.reduce((max, ex) => (ex.id > max ? ex.id : max), 0);
            exercise.id = maxId + 1;
            
            // Osiguraj da bodyPart odgovara jednoj od kategorija
            const validBodyParts = ['Chest', 'Back', 'Legs', 'Arms', 'Shoulders'];
            if (!validBodyParts.includes(exercise.bodyPart)) {
                exercise.bodyPart = 'Other';
            }
            
            data.exercises.push(exercise);
            await AsyncStorage.setItem(this.storageKey, JSON.stringify(data));
            return exercise;
        } else {
            console.error("Failed to retrieve data for updating");
            return null;
        }
    }

    static async deleteWorkout(id) {
        const data = await this.getData();
        const filteredWorkouts = data.workouts.filter(workout => workout.id !== id);
        data.workouts = filteredWorkouts;
        await AsyncStorage.setItem(this.storageKey, JSON.stringify(data));
    }

    static async getExercisesByCategory(category) {
        const data = await this.getData();
        if (data && data.exercises) {
            return data.exercises.filter(exercise => 
                exercise.bodyPart.toLowerCase() === category.toLowerCase()
            );
        }
        return [];
    }
}

export default WorkoutService;
