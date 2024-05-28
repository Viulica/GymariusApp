import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import moment from 'moment';
import { LineChart } from 'react-native-chart-kit';
import WorkoutService from '../services/WorkoutService';

const calculateOneRepMax = (weight, reps) => {
  return weight * (1 + reps / 30);
};

const ExerciseStatisticsScreen = ({ route }) => {
  const { exerciseId } = route.params;
  const [exerciseData, setExerciseData] = useState(null);

  useEffect(() => {
    const fetchExerciseData = async () => {
      const allWorkouts = await WorkoutService.getWorkouts();
      const filteredWorkouts = allWorkouts.filter(workout =>
        workout.exercises.some(ex => ex.id === exerciseId)
      );
      const exerciseDetails = filteredWorkouts.map(workout => {
        const exercise = workout.exercises.find(ex => ex.id === exerciseId);
        const totalWeight = exercise.sets.reduce((sum, set) => sum + (set.weight * set.reps), 0);
        const oneRepMaxes = exercise.sets.map(set => calculateOneRepMax(set.weight, set.reps));
        const oneRepMax = Math.max(...oneRepMaxes);
        const name = exercise.name;
        return {
          date: workout.date,
          totalWeight,
          oneRepMax,
          name
        };
      });
      setExerciseData(exerciseDetails);
    };
    fetchExerciseData();
  }, [exerciseId]);

  const chartData = {
    labels: exerciseData ? exerciseData.map(data => moment(data.date).format('YYYY-MM-DD')) : [],
    datasets: [
      {
        data: exerciseData ? exerciseData.map(data => data.oneRepMax) : [],
        color: (opacity = 1) => `rgba(134, 65, 244, ${opacity})`,
        strokeWidth: 2, 
      },
    ],
  };

  return (
    <View style={styles.container}>
      {exerciseData ? (
        <>
          <Text style={styles.title}>
            {exerciseData.length > 0 ? exerciseData[0].name : ''} Statistics
          </Text>
          <LineChart
            data={chartData}
            width={Dimensions.get('window').width - 20} 
            height={220}
            yAxisLabel=""
            yAxisSuffix=" kg"
            chartConfig={{
              backgroundColor: '#e26a00',
              backgroundGradientFrom: '#fb8c00',
              backgroundGradientTo: '#ffa726',
              decimalPlaces: 2,
              color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              style: {
                borderRadius: 16,
              },
              propsForDots: {
                r: '6',
                strokeWidth: '2',
                stroke: '#ffa726',
              },
            }}
            bezier
            style={{
              marginVertical: 8,
              borderRadius: 16,
            }}
          />
          <ScrollView style={styles.scrollView}>
            {exerciseData.map((data, index) => (
              <View key={index} style={styles.dataContainer}>
                <Text>Date: {moment(data.date).format('YYYY-MM-DD')}</Text>
                <Text>Total Weight: {data.totalWeight} kg</Text>
                <Text>One-Rep Max: {data.oneRepMax.toFixed(2)} kg</Text>
              </View>
            ))}
          </ScrollView>
        </>
      ) : (
        <Text>Loading...</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
    marginTop: 20,
  },
  dataContainer: {
    marginBottom: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    backgroundColor: '#f9f9f9',
  },
});

export default ExerciseStatisticsScreen;
