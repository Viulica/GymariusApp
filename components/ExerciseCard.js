import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';

const ExerciseCard = ({ exercise, onAddSet, onDeleteSet, onDelete }) => {
    const { theme } = useTheme();
    const [weight, setWeight] = useState('');
    const [reps, setReps] = useState('');
    const [lastSet, setLastSet] = useState(null);
    const [isAddingSet, setIsAddingSet] = useState(false);

    const handleAddSet = () => {
        if (weight && reps) {
            onAddSet(exercise.id, parseFloat(weight), parseInt(reps));
            setLastSet({ weight, reps });
            setWeight('');
            setReps('');
            setIsAddingSet(false);
        }
    };

    const styles = useMemo(() => StyleSheet.create({
        card: {
            backgroundColor: theme?.surface || '#ffffff',
            borderRadius: 10,
            padding: 15,
            marginVertical: 10,
            shadowColor: theme?.text || '#000000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3,
        },
        header: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 15,
        },
        cardTitle: {
            fontSize: 18,
            fontWeight: '600',
            color: theme?.text || '#333333',
        },
        tableHeader: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            paddingBottom: 10,
            borderBottomWidth: 1,
            borderBottomColor: theme?.border || '#ccc',
        },
        headerText: {
            fontWeight: 'bold',
            flex: 1,
            textAlign: 'center',
            color: theme?.text || '#333333',
        },
        setRow: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingVertical: 10,
            borderBottomWidth: 1,
            borderBottomColor: theme?.border || '#ccc',
        },
        setText: {
            flex: 1,
            textAlign: 'center',
            color: theme?.text || '#333333',
        },
        inputRow: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingVertical: 10,
            borderBottomWidth: 1,
            borderBottomColor: theme?.border || '#ccc',
        },
        input: {
            flex: 1,
            borderWidth: 1,
            borderColor: theme?.border || '#ccc',
            borderRadius: 5,
            padding: 8,
            marginHorizontal: 5,
            textAlign: 'center',
            color: theme?.text || '#333333',
        },
        addButton: {
            padding: 5,
        },
        addSetButton: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 10,
            marginTop: 10,
            backgroundColor: theme?.background || '#ffffff',
            borderRadius: 5,
        },
        addSetText: {
            marginLeft: 8,
            color: theme?.primary || '#1565C0',
            fontWeight: '600',
        },
        inputActions: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: 70,
        },
        actionButton: {
            padding: 5,
        },
    }), [theme]);

    if (!theme) {
        return null;
    }

    return (
        <View style={styles.card}>
            <View style={styles.header}>
                <Text style={styles.cardTitle}>{`${exercise.name} - ${exercise.type}`}</Text>
                <TouchableOpacity onPress={() => onDelete(exercise.id)} style={styles.deleteExerciseButton}>
                    <Ionicons name="trash" size={24} color="red" />
                </TouchableOpacity>
            </View>

            <View style={styles.tableHeader}>
                <Text style={styles.headerText}>Set</Text>
                <Text style={styles.headerText}>kg</Text>
                <Text style={styles.headerText}>Reps</Text>
                <Text style={styles.headerText}>Action</Text>
            </View>

            {exercise.sets.map((set, index) => (
                <View key={index} style={styles.setRow}>
                    <Text style={styles.setText}>{index + 1}</Text>
                    <Text style={styles.setText}>{set.weight}</Text>
                    <Text style={styles.setText}>{set.reps}</Text>
                    <TouchableOpacity onPress={() => onDeleteSet(exercise.id, index)}>
                        <Ionicons name="close-circle" size={24} color="red" />
                    </TouchableOpacity>
                </View>
            ))}

            {isAddingSet ? (
                <View style={styles.inputRow}>
                    <Text style={styles.setText}>{exercise.sets.length + 1}</Text>
                    <TextInput
                        style={styles.input}
                        placeholder={lastSet ? lastSet.weight.toString() : "kg"}
                        placeholderTextColor="#999"
                        value={weight}
                        onChangeText={setWeight}
                        keyboardType="numeric"
                        autoFocus={true}
                    />
                    <TextInput
                        style={styles.input}
                        placeholder={lastSet ? lastSet.reps.toString() : "reps"}
                        placeholderTextColor="#999"
                        value={reps}
                        onChangeText={setReps}
                        keyboardType="numeric"
                    />
                    <View style={styles.inputActions}>
                        <TouchableOpacity onPress={handleAddSet} style={styles.actionButton}>
                            <Ionicons name="checkmark-circle" size={24} color="#00C853" />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setIsAddingSet(false)} style={styles.actionButton}>
                            <Ionicons name="close-circle" size={24} color="#FF6347" />
                        </TouchableOpacity>
                    </View>
                </View>
            ) : (
                <TouchableOpacity 
                    onPress={() => setIsAddingSet(true)} 
                    style={styles.addSetButton}
                >
                    <Ionicons name="add-circle" size={24} color="#1565C0" />
                    <Text style={styles.addSetText}>Add Set</Text>
                </TouchableOpacity>
            )}
        </View>
    );
};

export default ExerciseCard;
