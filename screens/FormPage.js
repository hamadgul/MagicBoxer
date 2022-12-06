import React, { useState } from 'react';
import { Alert, Button, StyleSheet, Text, TextInput, View} from "react-native";
import { Form} from 'native-base';

export default class FormPage extends React.Component {
    
    static ItemDetails = (props) => {
        return (
            <View>
                <Text>Item Name: {props.itemName}</Text>
                <Text>Item Width: {props.itemWidth}</Text>
                <Text>Item Height: {props.itemHeight}</Text>
                <Text>Item Length: {props.itemLength}</Text>
            </View>
        );
    };
    
    constructor(props) {
        super(props);
        this.state = {
            itemName: '',
            itemWidth: 0,
            itemHeight: 0,
            itemLength: 0,
            items: [],
            showDetails: false
        };
        this.handleChange = this.handleChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
        this.resetForm = this.resetForm.bind(this);
        }    
        resetForm = () => {
            this.setState({
              itemName: '',
              itemWidth: 0,
              itemHeight: 0,
              itemLength: 0
            });
          }

        handleChange = itemName => {
        this.setState({itemName});
        }
    
    
        handleSubmit = e => {
            if (isNaN(this.state.itemLength) || isNaN(this.state.itemWidth) || isNaN(this.state.itemHeight)) {
                // Display an error message
                Alert.alert('Error', 'Item length, width, and height must be numeric values.');
                // prevent the form from being submitted
                return;
            }
        alert('An item was submitted: ' + this.state.itemName);
        this.setState(prevState => ({
            items: [...prevState.items, {
                itemName: this.state.itemName,
                itemWidth: this.state.itemWidth,
                itemHeight: this.state.itemHeight,
                itemLength: this.state.itemLength
            }]
        }));
        this.resetForm();
    }   
        render(){
    

            return (
                <Form onSubmit={this.handleSubmit}>
                  <Text style={styles.label}>Item Name:</Text>
                  <TextInput
                    style={styles.input}
                    value={this.state.itemName}
                    onChangeText={this.handleChange}
                  />
                  <Text style={styles.label}>Width:</Text>
                  <TextInput
                    style={styles.input}
                    value={this.state.itemWidth}
                    onChangeText={text => this.setState({ itemWidth: text })}
                  />
                  <Text style={styles.label}>Height:</Text>
                  <TextInput
                    style={styles.input}
                    value={this.state.itemHeight}
                    onChangeText={text => this.setState({ itemHeight: text })}
                  />
                  <Text style={styles.label}>Length:</Text>
                  <TextInput
                    style={styles.input}
                    value={this.state.itemLength}
                    onChangeText={text => this.setState({ itemLength: text })}
                  />
                  <Button 
                    block style={styles.submitButton} 
                    onPress={() => {
                    this.handleSubmit();
                    this.resetForm();
                }}
                    title = "Submit">
                    <Text>Submit</Text>
                  </Button>
                <View>
                {this.state.items.map(item => (
                        <FormPage.ItemDetails
                            itemName={item.itemName}
                            itemWidth={item.itemWidth}
                            itemHeight={item.itemHeight}
                            itemLength={item.itemLength}
                        />
                    ))}
                </View>
            </Form>
              );
            }
    }
  
    const styles = StyleSheet.create({
        label: {
            fontSize: 18,
            marginBottom: 10
        },
        input: {
            height: 40,
            borderColor: 'gray',
            borderWidth: 1,
            marginBottom: 20,
            paddingHorizontal: 10
        },
        submitButton: {
            marginTop: 10
        }
    });
