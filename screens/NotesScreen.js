import React, { useEffect, useState } from 'react';
import { View, FlatList, Text, Button, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/FontAwesome'; 
import NoteService from '../services/NoteService';
import { useTheme } from '../contexts/ThemeContext';

const NotesScreen = ({ navigation }) => {
    const { theme } = useTheme();
    const [notes, setNotes] = useState([]);
    const isFocused = useIsFocused();

    useEffect(() => {
        if (isFocused) {
            loadNotes();
        }
    }, [isFocused]);

    const loadNotes = async () => {
        const storedNotes = await NoteService.getNotes();
        setNotes(storedNotes);
    };

    const deleteNote = async (id) => {
        await NoteService.deleteNoteById(id);
        setNotes(notes.filter(note => note.id !== id));
    };

    const handleDelete = (id) => {
        Alert.alert("Delete Note", "Are you sure you want to delete this note?", [
            { text: "Cancel", style: "cancel" },
            { text: "Delete", onPress: () => deleteNote(id), style: "destructive" }
        ]);
    };

    const renderItem = ({ item }) => (
        <View style={[styles.note, { backgroundColor: theme.surface }]}>
            <TouchableOpacity 
                style={styles.noteContent} 
                onPress={() => navigation.navigate('NoteDetail', { note: item })}
            >
                <Text style={[styles.noteText, { color: theme.text }]}>{item.title}</Text>
                <Text style={[styles.previewText, { color: theme.textSecondary }]} numberOfLines={1}>
                    {item.text}
                </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.deleteIcon} onPress={() => handleDelete(item.id)}>
                <Icon name="trash" size={24} color={theme.error} />
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={[styles.header, { backgroundColor: theme.surface }]}>
                <Text style={[
                    styles.headerTitle, 
                    { 
                        color: theme.text,
                        fontFamily: theme.titleFont 
                    }
                ]}>
                    Your Notes
                </Text>
            </View>
            <FlatList
                data={notes}
                keyExtractor={item => item.id}
                renderItem={renderItem}
                contentContainerStyle={styles.listContent}
            />
            <TouchableOpacity 
                style={[styles.addButton, { backgroundColor: theme.primary }]} 
                onPress={() => navigation.navigate('NoteDetail')}
            >
                <Icon name="plus" size={30} color="#fff" />
            </TouchableOpacity>
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
        paddingTop: 60,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    headerTitle: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#1a1a1a',
    },
    listContent: {
        paddingTop: 12,
    },
    note: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        marginHorizontal: 16,
        marginBottom: 12,
        borderRadius: 12,
        backgroundColor: '#fff',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    noteContent: {
        flex: 1,
    },
    noteText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    previewText: {
        fontSize: 14
    },
    deleteIcon: {
        padding: 10,
    },
    addButton: {
        position: 'absolute',
        right: 20,
        bottom: 20,
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#1565C0',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
    }
});

export default NotesScreen;
