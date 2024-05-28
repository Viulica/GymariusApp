import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';

const ExercisePicker = ({ exercises, selectedValue, onChange }) => {
    const [open, setOpen] = useState(false); 
    const [items, setItems] = useState(exercises.map(ex => ({
        label: `${ex.name} - ${ex.type}`, 
        value: ex.id,
    }))); 

    return (
        <View style={styles.container}>
            <DropDownPicker
                open={open}
                value={selectedValue}
                items={items}
                setOpen={setOpen}
                setValue={onChange}
                setItems={setItems}
                searchable={true}
                placeholder="Select an exercise"
                searchPlaceholder="Search exercises..."
                listMode="MODAL"
                modalProps={{
                    animationType: "slide"
                }}
                modalContentContainerStyle={styles.modalContentContainerStyle}
                searchTextInputStyle={styles.searchTextInputStyle}
                zIndex={3000} 
                zIndexInverse={1000} 
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        minWidth: '50%', 
        backgroundColor: '#f9f9f9',
        maxHeight: 10
    },
    modalContentContainerStyle: {
        paddingHorizontal: 10,
        backgroundColor: 'white',
    },
    searchTextInputStyle: {
        borderBottomColor: '#ccc',
        borderBottomWidth: 1,
    },
    dropDownContainerStyle: {
        maxHeight: 50
    },
        dropdown: {
        height: 40, 
        backgroundColor: '#fafafa',
    },
    dropdownContainer: {
        height: 40,
    },
    listItemContainer: {
        height: 40, 
    },
    listItemLabel: {
        fontSize: 16,
    },
});

export default ExercisePicker;
