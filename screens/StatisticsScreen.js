import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView, TouchableOpacity } from 'react-native';
import { BarChart, LineChart } from 'react-native-chart-kit';
import WorkoutService from '../services/WorkoutService';
import moment from 'moment';
import { Ionicons } from '@expo/vector-icons';

const StatisticsScreen = ({ workouts }) => {
    const [monthlyData, setMonthlyData] = useState({
        labels: [],
        datasets: [{ data: [] }]
    });
    const [totalWorkouts, setTotalWorkouts] = useState(0);
    const [totalExercises, setTotalExercises] = useState(0);
    const [averageExercises, setAverageExercises] = useState(0);
    const [mostFrequentExercise, setMostFrequentExercise] = useState({ name: '', count: 0 });
    const [selectedExercise, setSelectedExercise] = useState(null);
    const [exerciseProgress, setExerciseProgress] = useState({
        labels: [],
        datasets: [{ data: [] }]
    });
    const [availableExercises, setAvailableExercises] = useState([]);

    useEffect(() => {
        if (workouts) {
            processWorkoutData(workouts);
            processAvailableExercises(workouts);
        }
    }, [workouts]);

    useEffect(() => {
        setSelectedExercise(null);
        setExerciseProgress({
            labels: [],
            datasets: [{ data: [] }]
        });
    }, [workouts]);

    const processWorkoutData = (workouts) => {
        // Mjesečna statistika
        const last6Months = {};
        const exerciseCounts = {};
        let totalExerciseCount = 0;

        // Inicijaliziraj zadnjih 6 mjeseci s 0
        for (let i = 5; i >= 0; i--) {
            const monthKey = moment().subtract(i, 'months').format('MMM');
            last6Months[monthKey] = 0;
        }

        // Sortiraj treninge po datumu, najnoviji prvi
        const sortedWorkouts = [...workouts].sort((a, b) => 
            moment(b.date).valueOf() - moment(a.date).valueOf()
        );

        // Uzmi samo treninge iz zadnjih 6 mjeseci
        const sixMonthsAgo = moment().subtract(6, 'months');
        
        sortedWorkouts.forEach(workout => {
            const workoutDate = moment(workout.date);
            if (workoutDate.isAfter(sixMonthsAgo)) {
                const monthKey = workoutDate.format('MMM');
                if (last6Months.hasOwnProperty(monthKey)) {
                    last6Months[monthKey]++;
                }
            }

            // Brojanje vježbi
            workout.exercises.forEach(exercise => {
                exerciseCounts[exercise.name] = (exerciseCounts[exercise.name] || 0) + 1;
                totalExerciseCount++;
            });
        });

        // Nađi najčešću vježbu
        const mostFrequent = Object.entries(exerciseCounts)
            .reduce((max, [name, count]) => 
                count > max.count ? {name, count} : max, 
                {name: '', count: 0}
            );

        setMonthlyData({
            labels: Object.keys(last6Months),
            datasets: [{ data: Object.values(last6Months) }]
        });

        setTotalWorkouts(workouts.length);
        setTotalExercises(totalExerciseCount);
        setAverageExercises(workouts.length ? (totalExerciseCount / workouts.length).toFixed(1) : 0);
        setMostFrequentExercise(mostFrequent);
    };

    const processAvailableExercises = (workouts) => {
        const exercises = new Set();
        workouts.forEach(workout => {
            workout.exercises.forEach(exercise => {
                exercises.add(exercise.name);
            });
        });
        setAvailableExercises(Array.from(exercises).sort());
    };

    const handleExerciseSelect = async (exerciseName) => {
        console.log('StatisticsScreen - Selected exercise:', exerciseName);
        setSelectedExercise(exerciseName);
        await processExerciseProgress(exerciseName);
    };

    const processExerciseProgress = async (exerciseName) => {
        console.log('StatisticsScreen - Processing progress for:', exerciseName);
        const progressData = {
            labels: [],
            datasets: [{ data: [] }]
        };

        const exerciseData = [];

        workouts.forEach(workout => {
            workout.exercises.forEach(exercise => {
                if (exercise.name === exerciseName && exercise.sets.length > 0) {
                    const maxWeight = Math.max(...exercise.sets.map(set => set.weight));
                    exerciseData.push({
                        date: moment(workout.date),
                        weight: maxWeight
                    });
                }
            });
        });

        // Sortiraj po datumu i uzmi zadnjih 6 unosa
        exerciseData.sort((a, b) => a.date - b.date);
        const last6Entries = exerciseData.slice(-6);

        progressData.labels = last6Entries.map(entry => entry.date.format('MMM D'));
        progressData.datasets[0].data = last6Entries.map(entry => entry.weight);

        setExerciseProgress(progressData);
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Workout Statistics</Text>
                <Text style={styles.headerSubtitle}>Last 6 months activity</Text>
            </View>

            <View style={styles.statsGrid}>
                <View style={styles.statsCard}>
                    <Text style={styles.statsNumber}>{totalWorkouts}</Text>
                    <Text style={styles.statsLabel}>Total Workouts</Text>
                </View>
                <View style={styles.statsCard}>
                    <Text style={styles.statsNumber}>{totalExercises}</Text>
                    <Text style={styles.statsLabel}>Total Exercises</Text>
                </View>
                <View style={styles.statsCard}>
                    <Text style={styles.statsNumber}>{averageExercises}</Text>
                    <Text style={styles.statsLabel}>Avg. Exercises/Workout</Text>
                </View>
                <View style={styles.statsCard}>
                    <Text style={styles.statsNumber}>{mostFrequentExercise.count}</Text>
                    <Text style={styles.statsLabel}>Most Used Exercise</Text>
                    <Text style={styles.statsSubtext}>{mostFrequentExercise.name}</Text>
                </View>
            </View>

            <View style={styles.chartContainer}>
                <Text style={styles.chartTitle}>Monthly Workout Frequency</Text>
                <BarChart
                    data={monthlyData}
                    width={Dimensions.get('window').width - 48}
                    height={220}
                    yAxisLabel=""
                    chartConfig={{
                        backgroundColor: '#ffffff',
                        backgroundGradientFrom: '#ffffff',
                        backgroundGradientTo: '#ffffff',
                        decimalPlaces: 0,
                        color: (opacity = 1) => `rgba(21, 101, 192, ${opacity})`,
                        labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                        style: {
                            borderRadius: 16,
                        },
                        propsForBackgroundLines: {
                            strokeDasharray: '',
                            strokeWidth: 1,
                            stroke: "#e3e3e3",
                        },
                        barPercentage: 0.7,
                    }}
                    style={styles.chart}
                    showValuesOnTopOfBars={true}
                    fromZero={true}
                    horizontalLabelRotation={0}
                />
            </View>

            <View style={styles.exerciseProgressSection}>
                <Text style={styles.sectionTitle}>Exercise Progress</Text>
                <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false}
                    style={styles.exerciseList}
                >
                    {availableExercises.map((exercise, index) => (
                        <TouchableOpacity
                            key={index}
                            style={[
                                styles.exerciseChip,
                                selectedExercise === exercise && styles.exerciseChipSelected
                            ]}
                            onPress={() => handleExerciseSelect(exercise)}
                        >
                            <Text style={[
                                styles.exerciseChipText,
                                selectedExercise === exercise && styles.exerciseChipTextSelected
                            ]}>
                                {exercise}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                {!selectedExercise ? (
                    <View style={styles.noDataContainer}>
                        <Text style={styles.noDataText}>Select an exercise to view progress</Text>
                    </View>
                ) : exerciseProgress.datasets[0].data.length > 0 ? (
                    <View style={styles.progressChart}>
                        <Text style={styles.chartTitle}>
                            {selectedExercise} - Max Weight Progress
                        </Text>
                        <LineChart
                            data={exerciseProgress}
                            width={Dimensions.get('window').width - 32}
                            height={220}
                            chartConfig={{
                                backgroundColor: '#ffffff',
                                backgroundGradientFrom: '#ffffff',
                                backgroundGradientTo: '#ffffff',
                                decimalPlaces: 0,
                                color: (opacity = 1) => `rgba(21, 101, 192, ${opacity})`,
                                labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                                style: {
                                    borderRadius: 16
                                },
                                propsForDots: {
                                    r: "6",
                                    strokeWidth: "2",
                                    stroke: "#1565C0"
                                }
                            }}
                            style={styles.chart}
                            bezier
                        />
                    </View>
                ) : (
                    <View style={styles.noDataContainer}>
                        <Text style={styles.noDataText}>No progress data available for {selectedExercise}</Text>
                    </View>
                )}
            </View>
        </ScrollView>
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
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        padding: 8,
        justifyContent: 'space-between',
    },
    statsCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        margin: 8,
        width: '45%',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    statsNumber: {
        fontSize: 24,
        fontWeight: '700',
        color: '#1565C0',
        marginBottom: 4,
    },
    statsLabel: {
        fontSize: 14,
        color: '#666',
        fontWeight: '500',
    },
    statsSubtext: {
        fontSize: 12,
        color: '#999',
        marginTop: 4,
    },
    chartContainer: {
        backgroundColor: '#fff',
        margin: 16,
        padding: 16,
        paddingRight: 24,
        borderRadius: 12,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    chartTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginBottom: 16,
    },
    chart: {
        borderRadius: 12,
        paddingRight: 0,
    },
    exerciseProgressSection: {
        backgroundColor: '#fff',
        margin: 16,
        padding: 16,
        borderRadius: 12,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginBottom: 16,
    },
    exerciseList: {
        marginBottom: 16,
    },
    exerciseChip: {
        backgroundColor: '#f0f0f0',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        marginRight: 8,
    },
    exerciseChipSelected: {
        backgroundColor: '#1565C0',
    },
    exerciseChipText: {
        color: '#666',
        fontWeight: '500',
    },
    exerciseChipTextSelected: {
        color: '#fff',
    },
    progressChart: {
        marginTop: 16,
    },
    noDataContainer: {
        padding: 20,
        alignItems: 'center',
        justifyContent: 'center',
        height: 220,
    },
    noDataText: {
        color: '#666',
        fontSize: 16,
        textAlign: 'center',
    },
});

export default StatisticsScreen;
