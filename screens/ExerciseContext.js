import React, { createContext, useState, useEffect } from 'react';
import WorkoutService from '../services/WorkoutService';

export const ExerciseContext = createContext();

export const ExerciseProvider = ({ children }) => {
    const [predefinedExercises, setPredefinedExercises] = useState([]);

    useEffect(() => {
        const loadExercises = async () => {
            await WorkoutService.initializeAppData();
            const storedExercises = await WorkoutService.getExercises();
            setPredefinedExercises(storedExercises);
        };

        loadExercises();
    }, []);

    return (
        <ExerciseContext.Provider value={{ predefinedExercises, setPredefinedExercises }}>
            {children}
        </ExerciseContext.Provider>
    );
};
