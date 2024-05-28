import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const SetRow = ({ set, index, exerciseId, onAddSet, onDeleteSet, isAddRow }) => {
    const [weight, setWeight] = React.useState('');
    const [reps, setReps] = React.useState('');

    const handleAddSet = () => {
        if (weight && reps) {
            onAddSet(parseFloat(weight), parseInt(reps));
            setWeight('');
            setReps('');
        }
    };

    if (isAddRow) {
        return (
            <View style={styles.row}>
                <TextInput
                    style={[styles.input, styles.weightInput]}
                    placeholder="Weight"
                    value={weight}
                    onChangeText={setWeight}
                    keyboardType="numeric"
                />
                <TextInput
                    style={[styles.input, styles.repsInput]}
                    placeholder="Reps"
                    value={reps}
                    onChangeText={setReps}
                    keyboardType="numeric"
                />
                <View style={styles.buttonsContainer}>
                    <TouchableOpacity onPress={handleAddSet} style={styles.addButton}>
                        <Text style={styles.addButtonText}>Add</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => onDeleteSet(exerciseId, index)} style={styles.deleteButton}>
                        <Ionicons name="trash" size={24} color="red" />
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.row}>
            <Text style={styles.setText}>{`${set.weight} kg`}</Text>
            <Text style={styles.setText}>{`${set.reps} reps`}</Text>
            <TouchableOpacity onPress={() => onDeleteSet(exerciseId, index)} style={styles.deleteButton}>
                <Ionicons name="trash" size={24} color="red" />
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 5,
    },
    input: {
        height: 40,
        borderColor: 'gray',
        borderWidth: 1,
        marginRight: 10,
        paddingHorizontal: 5,
        flex: 1, 
    },
    weightInput: {
        width: '40%',
    },
    repsInput: {
        width: '30%',
    },
    buttonsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    addButton: {
        backgroundColor: '#00C853',
        padding: 10,
        borderRadius: 5,
        marginRight: 10,
    },
    addButtonText: {
        color: '#fff',
        fontWeight: '600',
    },
    deleteButton: {
        marginLeft: 10,
    },
    setText: {
        color: '#666',
        marginRight: 10,
        flex: 1, 
    },
});

export default SetRow;
