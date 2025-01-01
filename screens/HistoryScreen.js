import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
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
        setWorkouts(allWorkouts.reverse());
    };

    const handleDeleteWorkout = (id) => {
        Alert.alert(
            "Delete Workout",
            "Are you sure you want to delete this workout?",
            [
                { text: "Cancel", style: "cancel" },
                { text: "Delete", onPress: () => deleteWorkout(id), style: "destructive" }
            ]
        );
    };

    const deleteWorkout = async (id) => {
        await WorkoutService.deleteWorkout(id);
        fetchWorkouts();
    };

    const toggleDetails = (id) => {
        setExpandedWorkoutIds(prev => 
            prev.includes(id) ? prev.filter(wId => wId !== id) : [...prev, id]
        );
    };

    const renderWorkout = ({ item: workout }) => {
        const isExpanded = expandedWorkoutIds.includes(workout.id);
        const totalSets = workout.exercises.reduce((sum, ex) => sum + ex.sets.length, 0);
        
        const formatDuration = (seconds) => {
            if (!seconds) return '';
            const hours = Math.floor(seconds / 3600);
            const minutes = Math.floor((seconds % 3600) / 60);
            if (hours > 0) {
                return `${hours}h ${minutes}m`;
            }
            return `${minutes}m`;
        };

        return (
            <View style={styles.workoutCard}>
                <TouchableOpacity 
                    onPress={() => toggleDetails(workout.id)}
                    style={styles.workoutHeader}
                >
                    <View style={styles.workoutHeaderLeft}>
                        <Text style={styles.workoutTitle}>{workout.name}</Text>
                        <View style={styles.workoutMetadata}>
                            <Text style={styles.workoutDate}>
                                {moment(workout.date).format('MMM D, YYYY')}
                            </Text>
                            {workout.duration && (
                                <View style={styles.durationContainer}>
                                    <Ionicons name="time-outline" size={14} color="#666" />
                                    <Text style={styles.durationText}>
                                        {formatDuration(workout.duration)}
                                    </Text>
                                </View>
                            )}
                        </View>
                    </View>
                    <View style={styles.workoutHeaderRight}>
                        <View style={styles.statsContainer}>
                            <Text style={styles.statsNumber}>{workout.exercises.length}</Text>
                            <Text style={styles.statsLabel}>exercises</Text>
                        </View>
                        <View style={styles.statsContainer}>
                            <Text style={styles.statsNumber}>{totalSets}</Text>
                            <Text style={styles.statsLabel}>sets</Text>
                        </View>
                        <TouchableOpacity 
                            onPress={() => navigation.navigate('Workout', {
                                screen: 'New Workout',
                                params: {
                                    templateWorkout: workout 
                                }
                            })}
                            style={styles.templateButton}
                        >
                            <Ionicons name="copy-outline" size={20} color="#1565C0" />
                        </TouchableOpacity>
                        <TouchableOpacity 
                            onPress={() => handleDeleteWorkout(workout.id)}
                            style={styles.deleteButton}
                        >
                            <Ionicons name="trash-outline" size={20} color="#FF6B6B" />
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>

                {isExpanded && (
                    <View style={styles.exerciseList}>
                        {workout.exercises.map((exercise, idx) => (
                            <View key={idx} style={styles.exerciseItem}>
                                <Text style={styles.exerciseName}>{exercise.name}</Text>
                                <View style={styles.setsContainer}>
                                    {exercise.sets.map((set, setIdx) => (
                                        <View key={setIdx} style={styles.setItem}>
                                            <Text style={styles.setText}>
                                                {set.weight}kg × {set.reps}
                                            </Text>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        ))}
                    </View>
                )}
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Workout History</Text>
                <Text style={styles.headerSubtitle}>
                    {workouts.length} {workouts.length === 1 ? 'workout' : 'workouts'} recorded
                </Text>
            </View>
            <FlatList
                data={workouts}
                renderItem={renderWorkout}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContainer}
                showsVerticalScrollIndicator={false}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        backgroundColor: '#fff',
        padding: 20,
        paddingTop: 40,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '700',
        color: '#333',
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: 15,
        color: '#666',
        fontWeight: '500',
    },
    listContainer: {
        padding: 16,
        paddingTop: 8,
    },
    workoutCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        marginBottom: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        marginHorizontal: 2,
    },
    workoutHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 16,
    },
    workoutHeaderLeft: {
        flex: 1,
    },
    workoutHeaderRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    workoutTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    workoutDate: {
        fontSize: 14,
        color: '#666',
    },
    statsContainer: {
        alignItems: 'center',
        marginHorizontal: 8,
    },
    statsNumber: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1565C0',
    },
    statsLabel: {
        fontSize: 12,
        color: '#666',
    },
    deleteButton: {
        padding: 8,
        marginLeft: 8,
    },
    exerciseList: {
        paddingHorizontal: 16,
        paddingBottom: 16,
    },
    exerciseItem: {
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#eee',
    },
    exerciseName: {
        fontSize: 16,
        fontWeight: '500',
        color: '#333',
        marginBottom: 8,
    },
    setsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    setItem: {
        backgroundColor: '#f0f0f0',
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 4,
    },
    setText: {
        fontSize: 14,
        color: '#666',
    },
    templateButton: {
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#E3F2FD',
        padding: 8,
        borderRadius: 6,
        marginRight: 8,
        width: 36,
        height: 36,
    },
    workoutMetadata: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    durationContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    durationText: {
        fontSize: 14,
        color: '#666',
    },
});

export default HistoryScreen;
