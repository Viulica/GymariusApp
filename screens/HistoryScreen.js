import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons'; 
import WorkoutService from '../services/WorkoutService';
import moment from 'moment';

const HistoryScreen = ({ navigation }) => {
    const [workouts, setWorkouts] = useState([]);
    const [expandedWorkoutIds, setExpandedWorkoutIds] = useState([]);

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            fetchWorkouts();
        });

        fetchWorkouts();  

        return unsubscribe;
    }, [navigation]);

    const fetchWorkouts = async () => {
        const allWorkouts = await WorkoutService.getWorkouts();
        setWorkouts(allWorkouts);
    };

    const handleDeleteWorkout = (id) => {
        Alert.alert(
            "Delete Workout",
            "Are you sure you want to delete this workout?",
            [
                { text: "Cancel", style: "cancel" },
                { text: "OK", onPress: () => deleteWorkout(id) }
            ]
        );
    };

    const deleteWorkout = async (id) => {
        await WorkoutService.deleteWorkout(id);
        fetchWorkouts(); 
    };

    const toggleDetails = (id) => {
        const currentIndex = expandedWorkoutIds.indexOf(id);
        const newExpandedIds = [...expandedWorkoutIds];

        if (currentIndex === -1) {
            newExpandedIds.push(id); 
        } else {
            newExpandedIds.splice(currentIndex, 1); 
        }

        setExpandedWorkoutIds(newExpandedIds);
    };

    return (
        <ScrollView style={styles.container}>
            {workouts.map((workout, index) => (
                <TouchableOpacity 
                    key={workout.id} 
                    style={styles.workoutDetails} 
                    onPress={() => toggleDetails(workout.id)}
                >
                    <View style={styles.workoutHeader}>
                        <View>
                            <Text style={styles.workoutTitle}>{workout.name}</Text>
                            <Text>Date: {moment(workout.date).format('D.M.YYYY')}</Text> 
                            <Text>Exercises: {workout.exercises.length}</Text>
                        </View>
                        <View style={styles.buttonContainer}>
                            <TouchableOpacity onPress={() => toggleDetails(workout.id)} style={styles.detailsButton}>
                                <Text style={styles.detailsButtonText}>See Details</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => handleDeleteWorkout(workout.id)} style={styles.deleteButton}>
                                <Ionicons name="trash" size={24} color="red" />
                            </TouchableOpacity>
                        </View>
                    </View>
                    {expandedWorkoutIds.includes(workout.id) && (
                        <View style={styles.exerciseDetails}>
                            {workout.exercises.map((exercise, idx) => (
                                <View key={`${workout.id}-exercise-${idx}`}>
                                    <Text style={styles.exerciseName}>{exercise.name}</Text>
                                    {exercise.sets.map((set, setIdx) => (
                                        <Text key={`${workout.id}-exercise-${idx}-set-${setIdx}`}>
                                            {set.reps} reps of {set.weight} lbs
                                        </Text>
                                    ))}
                                </View>
                            ))}
                        </View>
                    )}
                </TouchableOpacity>
            ))}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: 20
    },
    workoutDetails: {
        margin: 20,
        padding: 10,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        backgroundColor: '#f9f9f9'
    },
    workoutHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    workoutTitle: {
        fontSize: 18,
        fontWeight: 'bold'
    },
    buttonContainer: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    detailsButton: {
        backgroundColor: '#4CAF50',
        padding: 5,
        borderRadius: 5,
        marginRight: 10,
    },
    detailsButtonText: {
        color: '#fff',
        fontWeight: 'bold'
    },
    deleteButton: {
        padding: 5,
    },
    exerciseDetails: {
        marginTop: 10,
        paddingLeft: 10
    },
    exerciseName: {
        fontWeight: 'bold'
    }
});

export default HistoryScreen;
