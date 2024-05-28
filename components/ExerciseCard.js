import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import SetRow from './SetRow';
import { Ionicons } from '@expo/vector-icons';

const ExerciseCard = ({ exercise, sets, onAddSet, onDeleteSet, onDeleteExercise }) => {
    return (
        <View style={styles.card}>
            <View style={styles.header}>
                <Text style={styles.cardTitle}>{`${exercise.name} - ${exercise.type}`}</Text>
                <TouchableOpacity onPress={() => onDeleteExercise(exercise.id)} style={styles.deleteExerciseButton}>
                    <Ionicons name="trash" size={24} color="red" />
                </TouchableOpacity>
            </View>
            <View style={styles.tableHeader}>
                <Text style={styles.headerText}>kg</Text>
                <Text style={styles.headerText}>Reps</Text>
            </View>
            {sets.map((set, index) => (
                <SetRow 
                    key={index} 
                    set={set} 
                    index={index} 
                    exerciseId={exercise.id} 
                    onDeleteSet={onDeleteSet} 
                />
            ))}
            <SetRow onAddSet={(weight, reps) => onAddSet(exercise.id, weight, reps)} isAddRow />
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: 'transparent',
        borderRadius: 10,
        padding: 15,
        marginVertical: 10,
        width: '100%',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#007bff',
        marginBottom: 25,
    },
    deleteExerciseButton: {
        marginBottom: 25,
    },
    tableHeader: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        marginBottom: 10,
    },
    headerText: {
        fontWeight: 'bold',
        color: '#333',
        width: 100,
        marginRight: 10,
    },
    setInfo: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        paddingVertical: 5,
    },
    setText: {
        color: '#666',
        marginRight: 10,
        width: 100,
    }
});

export default ExerciseCard;
