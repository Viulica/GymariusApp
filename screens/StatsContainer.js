import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import WorkoutService from '../services/WorkoutService';
import StatisticsScreen from './StatisticsScreen';
import ExerciseStatisticsScreen from './ExerciseStatisticsScreen'; 
import { createStackNavigator } from '@react-navigation/stack';

const Stack = createStackNavigator();

const StatsContainer = ({ navigation }) => {
    const [workouts, setWorkouts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            fetchWorkouts();
        });

        fetchWorkouts();
        return unsubscribe;
    }, [navigation]);

    const fetchWorkouts = async () => {
        try {
            const allWorkouts = await WorkoutService.getWorkouts();
            setWorkouts(allWorkouts);
        } catch (error) {
            console.error('Failed to fetch workouts:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.container}>
                <ActivityIndicator size="large" color="#1565C0" />
            </View>
        );
    }

    if (workouts.length === 0) {
        return (
            <View style={styles.container}>
                <Text style={styles.noDataText}>No workouts to display</Text>
            </View>
        );
    }

    return (
        <Stack.Navigator>
            <Stack.Screen 
                name="StatisticsMain" 
                options={{ headerShown: false }}
            >
                {props => <StatisticsScreen {...props} workouts={workouts} />}
            </Stack.Screen>
            <Stack.Screen 
                name="ExerciseStatistics" 
                component={ExerciseStatisticsScreen} 
                options={{ title: 'Exercise Statistics' }} 
            />
        </Stack.Navigator>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    noDataText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 16,
    },
});

export default StatsContainer;
