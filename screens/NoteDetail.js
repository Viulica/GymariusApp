import React, { useState, useEffect } from 'react';
import { View, TextInput, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import WorkoutService from '../services/WorkoutService';
import DropDownPicker from 'react-native-dropdown-picker';
import { useTheme } from '../contexts/ThemeContext';

const NoteDetail = ({ route, navigation }) => {
    const { theme } = useTheme();
    const [note, setNote] = useState(route.params?.note || { 
        id: null, 
        title: '', 
        text: '',
        linkedWorkouts: [] 
    });
    const [workouts, setWorkouts] = useState([]);
    const [open, setOpen] = useState(false);
    const [selectedWorkouts, setSelectedWorkouts] = useState([]);

    useEffect(() => {
        navigation.setOptions({ title: note.title ? note.title : 'New Note' });
        loadWorkouts();
    }, [note.title]);

    const loadWorkouts = async () => {
        const allWorkouts = await WorkoutService.getWorkouts();
        const workoutItems = allWorkouts.map(workout => ({
            label: `${workout.name} (${new Date(workout.date).toLocaleDateString()})`,
            value: workout.id
        }));
        setWorkouts(workoutItems);
        if (note.linkedWorkouts) {
            setSelectedWorkouts(note.linkedWorkouts);
        }
    };

    const saveNote = async () => {
        const newNote = {
            ...note,
            text: note.text,
            title: note.title || 'Untitled Note',
            linkedWorkouts: selectedWorkouts,
            date: new Date().toISOString()
        };

        // Spremi bilješku
        const storedNotes = await AsyncStorage.getItem('notes');
        let notes = storedNotes ? JSON.parse(storedNotes) : [];
        if (note.id) {
            const index = notes.findIndex(n => n.id === note.id);
            notes[index] = newNote;
        } else {
            newNote.id = Date.now().toString();
            notes.push(newNote);
        }
        await AsyncStorage.setItem('notes', JSON.stringify(notes));

        // Ažuriraj povezane treninge
        const allWorkouts = await WorkoutService.getWorkouts();
        const updatedWorkouts = allWorkouts.map(workout => {
            if (selectedWorkouts.includes(workout.id)) {
                const currentLinkedNotes = workout.linkedNotes || [];
                if (!currentLinkedNotes.includes(newNote.id)) {
                    return {
                        ...workout,
                        linkedNotes: [...currentLinkedNotes, newNote.id]
                    };
                }
            }
            return {
                ...workout,
                linkedNotes: workout.linkedNotes || []
            };
        });
        
        await WorkoutService.updateWorkouts(updatedWorkouts);
        navigation.goBack();
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={[styles.contentContainer, { backgroundColor: theme.surface }]}>
                <TextInput
                    value={note.title || ''}
                    onChangeText={(title) => setNote({ ...note, title })}
                    style={[styles.titleInput, { 
                        backgroundColor: theme.background,
                        color: theme.text,
                        borderColor: theme.border
                    }]}
                    placeholder="Note title..."
                    placeholderTextColor={theme.textSecondary}
                />
                <TextInput
                    value={note.text}
                    onChangeText={(text) => setNote({ ...note, text })}
                    style={[styles.input, { 
                        backgroundColor: theme.background,
                        color: theme.text,
                        borderColor: theme.border
                    }]}
                    multiline
                    placeholder="Type your note here..."
                    placeholderTextColor={theme.textSecondary}
                />
                
                <Text style={styles.label}>Link to Workouts:</Text>
                <DropDownPicker
                    open={open}
                    value={selectedWorkouts}
                    items={workouts}
                    setOpen={setOpen}
                    setValue={setSelectedWorkouts}
                    multiple={true}
                    mode="BADGE"
                    badgeDotColors={["#e76f51"]}
                    style={styles.dropdown}
                    placeholder="Select workouts to link"
                    maxHeight={200}
                    zIndex={1000}
                />

                <TouchableOpacity 
                    style={[styles.button, { backgroundColor: theme.primary }]} 
                    onPress={saveNote}
                >
                    <Text style={styles.buttonText}>Save</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff'
    },
    contentContainer: {
        padding: 16,
    },
    titleInput: {
        height: 48,
        borderColor: '#ccc',
        borderWidth: 1,
        padding: 10,
        fontSize: 18,
        fontWeight: '500',
        borderRadius: 5,
        backgroundColor: '#f9f9f9',
        marginBottom: 12,
    },
    input: {
        height: 200,
        borderColor: '#ccc',
        borderWidth: 1,
        padding: 10,
        fontSize: 16,
        borderRadius: 5,
        backgroundColor: '#f9f9f9',
        marginBottom: 20,
        textAlignVertical: 'top'
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    dropdown: {
        marginBottom: 20,
    },
    button: {
        marginTop: 20,
        backgroundColor: '#007BFF', 
        padding: 10,
        borderRadius: 5,
        justifyContent: 'center',
        alignItems: 'center'
    },
    buttonText: {
        color: '#ffffff', 
        fontSize: 18, 
        fontWeight: 'bold' 
    }
});

export default NoteDetail;
