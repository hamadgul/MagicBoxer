import React, { useState } from 'react';
import { Button, StyleSheet, Text, TextInput} from "react-native";
import { Form} from 'native-base';

export default class FormPage extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            itemName: '',
            itemWidth: 0,
            itemHeight: 0,
            itemLength: 0
        };
        this.handleChange = this.handleChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
    }    
    
        handleChange = itemName => {
        this.setState({itemName});
        }
    
    
        handleSubmit = e => {
        alert('An item was submitted: ' + this.state.itemName);
        }

        render(){
            return (
                <Form onSubmit={this.handleSubmit}>
                  <Text style={styles.label}>Name:</Text>
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
                    onPress={this.handleSubmit}
                    title = "Submit">
                    <Text>Submit</Text>
                  </Button>
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
