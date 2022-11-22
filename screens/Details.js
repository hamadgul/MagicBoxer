import React, { Component } from 'react';
import { Container, Header, Content, Card, CardItem, Body, Text, Input, Item } from 'native-base';
import { Modal, Picker, FlatList, ActivityIndicator, View, Dimensions, TouchableOpacity, StyleSheet, Button, Alert, TextInput, TouchableHighlight, Keyboard, TouchableWithoutFeedback } from 'react-native';
import AppNavigator from '../navigation/AppNavigator';
import { pack, createDisplay } from '../packing_algo/packing';
import { db } from './../firebase';


const deviceHeight = Dimensions.get('window').height;

export default class Details extends Component {


    constructor(props) {
        super(props);
        this.state = {
          isLoading: true,
          isShown: false,
          buttonDisabled: true,
          itemNumber: 0,
          items: 0,
          length: "--",
          height: "--",
          width: "--",
          allItems: {},
          modalDisplay: false,
          unit: "inches",
        }
        this.updateState = this.updateState.bind(this);

    }

    static navigationOptions = ({ navigation }) => {
      return {
        title: navigation.getParam('otherParam', 'Order Details'),
        headerStyle: { backgroundColor: '#ee3224' },
        headerTitleStyle: { color: 'white' },
        headerTintColor : 'white'

      };
    };

    GetDimensions = () => {
      var items = [];
      for (var key in this.state.allItems) {
        for (var i = 0; i < this.state.allItems[key][3]; i++) {
          items.push([parseFloat(this.state.allItems[key][0]), parseFloat(this.state.allItems[key][1]), parseFloat(this.state.allItems[key][2]), key]);
        }
      }
      var result = []
      var test = items.slice();
      result.push(pack(test, "USPS", 0));
      if (result[0] === 0) {
        Alert.alert("Items are too big for a single standard box. Multiple boxed orders have not been implemented yet.");
      }
      else {
        var scale = 10;
        if (Math.max(result[0].x, result[0].y, result[0].z) > 15) {
          scale = 20;
        }
        result.push(createDisplay(result[0], scale));
        const {navigate} = this.props.navigation;
        navigate('Display', { box: result[0], items: result[1], orderDetails: this.state.orderInfo});
      }
    }

    ShowHideTextComponentView = (itemNumber) => {
      if(this.state.isShown == true){
        this.setState({isShown: false});
      }
      else {
        this.setState({isShown: true, itemNumber: itemNumber});

      }
    }

    updateDims = (SKU, SKUQ) => {
      db.ref('items/' + SKU).once('value').then((snapshot) => {
        if (snapshot.exists()) {
          let allItems = Object.assign({}, this.state.allItems);
          allItems[SKU] = [snapshot.val().length, snapshot.val().width, snapshot.val().height, SKUQ];
          this.setState({allItems});
        }
      });
    }

    fetchDims = () => {
      for (var i = 0; i < this.state.items; i++) {
        var SKU = this.state.dataSource[i].ItemIdentifier.SupplierSKU;
        var SKUQ = this.state.dataSource[i].Quantity;
        this.updateDims(SKU, SKUQ)
      }
    }

//submits the dimensions the user has inputted

    SubmitDimensions = () => {
      var itemSKU = this.state.dataSource[this.state.itemNumber - 1].ItemIdentifier.SupplierSKU;
      var itemQ = this.state.dataSource[this.state.itemNumber-1].Quantity;
      writeItemData(itemSKU.toString(), [this.state.length, this.state.width, this.state.height]);
      this.setState({isShown: false});
      let allItems = Object.assign({}, this.state.allItems);
      allItems[itemSKU] = [this.state.length, this.state.width, this.state.height, itemQ];
      this.setState({allItems});
      this.setState({height: '--', width: '--', length: '--'});
    }

    closeModal = () => {
      this.setState({isShown: false});
      this.setState({height: '--', width: '--', length: '--'});
    }

    checkButton = () => {
      let numItems = Object.keys(this.state.allItems).length;
      if (numItems == this.state.items) {
        for (var key in this.state.allItems) {
          if (this.state.allItems[key].includes('--') || this.state.allItems[key].includes('0')) {
            return false;
          }
        }
        return true;
      }
      return false
    }

    updateState(){ 
      this.setState({
          isLoading: false,
          isShown: true,
          buttonDisabled: false,
          itemNumber: 12345,
          items: 1,
          length: "1",
          height: "7",
          width: "8",
          modalDisplay: true,
          unit: "inches",
          dataSource: "344565759",
          orderInfo: "none",
          items: this.items,
          itemSKU: "121232",
          ItemIdentifier: "1212",
          SupplierSKU: "656456465",
          allItems: {},
          }, () => {this.fetchDims();
        ()=> {this.checkButton()}
      });
    }

    render(){
     // if(this.state.isLoading){
    //    return(
     //     <View style={{flex: 1, padding: 20}}>
      //      <ActivityIndicator/>
      //    </View>
    //    )
    //  }
   //   else {
      (this.state.updateState);
       return (
         <View style={{flex: 1}}>
           <Container style={styles.container}>
             <Content padder>
             {this.state.dataSource.map((order, i) => (
               <Card key={i}>
                 <CardItem header bordered>
                   <Text>Item: {i+1}</Text>
                 </CardItem>
                 <CardItem bordered>
                   <Body>
                     <View style={styles.flexRow2}>
                       <View style={styles.leftView}>
                           <Text style={styles.dataTitleFont}>SKU:</Text>
                           <Text style={styles.dataFont}> {order.ItemIdentifier.SupplierSKU}</Text>
                       </View>
                       <View style={styles.leftView}>
                         <Text style={styles.dataTitleFont}>Quantity:</Text>
                         <Text style={styles.dataFont}> {order.Quantity}</Text>
                       </View>
                     </View>

                     {this.state.allItems.hasOwnProperty(order.ItemIdentifier.SupplierSKU) ?
                       <View style={{flexDirection: 'row'}}>
                         <Text style={styles.dataTitleFont}>Length: </Text>
                         <Text style={styles.dataFont}>{this.state.allItems[order.ItemIdentifier.SupplierSKU][0]}"</Text>
                         <Text style={styles.dataTitleFont}> Width: </Text>
                         <Text style={styles.dataFont}>{this.state.allItems[order.ItemIdentifier.SupplierSKU][1]}"</Text>
                         <Text style={styles.dataTitleFont}> Height: </Text>
                         <Text style={styles.dataFont}>{this.state.allItems[order.ItemIdentifier.SupplierSKU][2]}"</Text>
                       </View> :
                       <Text style={styles.dataTitleFont}>Length: --  Width: --  Height: --</Text>
                     }

                     {!this.checkButton() ?
                       <Text style={styles.dataTitleFont}>Dimensions Needed!</Text> : null
                     }
                    </Body>
                  </CardItem>
                  <CardItem footer bordered button
                  onPress = {() => {
                    this.ShowHideTextComponentView(i+1);
                  }}>
                    <Text>
                      Edit Dimensions
                    </Text>
                  </CardItem>
                </Card>
              ))}


              // Button Code
              <View style={styles.center}>
                <TouchableHighlight onPress={this.checkButton() ? this.GetDimensions : null} underlayColor="white" style={styles.touchStyle}>
                  <View style={!this.checkButton() ? styles.disabledButton : styles.buttonStyle}>
                    <Text style={!this.checkButton() ? styles.disabledButtonText : styles.buttonText}>Package Items</Text>
                  </View>
                </TouchableHighlight>
              </View>

              </Content>
            </Container>

            <Modal
              animationType="slide"
              // transparent={false}s
              visible={this.state.isShown}
              onRequestClose={() => {
                this.setState({
                  isShown: false
                })
              }}>
              <View style={{
                flex: 1,
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center'
              }}>
                <View style={{
                  width: 300,
                  height: 300
                }}>
                  <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
                    <Card>
                      <CardItem header bordered>
                        <Text style={styles.centerAligned}>Dimensions for Item {this.state.itemNumber}</Text>
                      </CardItem>
                      <CardItem bordered>
                        <Body>
                          <View style={styles.flexRow}>
                            <View style={styles.textCenter}><Text>Length:</Text></View>
                            <TextInput style={styles.inputBox}
                              keyboardType='numeric'
                              onChangeText={length => this.setState({ length })}
                              maxLength={10}
                            />
                          </View>

                          <View style={styles.flexRow}>
                            <View style={styles.textCenter}><Text>Width:</Text></View>
                            <TextInput style={styles.inputBox}
                              keyboardType='numeric'
                              onChangeText={width => this.setState({ width })}
                              maxLength={10}
                            />
                          </View>

                          <View style={styles.flexRow}>
                            <View style={styles.textCenter}><Text>Height:</Text></View>
                            <TextInput style={styles.inputBox}
                              keyboardType='numeric'
                              onChangeText={height => this.setState({ height })}
                              maxLength={10}
                            />
                          </View>
                        </Body>
                      </CardItem>
                      <CardItem footer bordered button
                        onPress={() => {
                          this.SubmitDimensions();
                        }}>
                        <Text style={styles.centerAligned}>
                          Submit Dimensions
                        </Text>
                      </CardItem>
                      <CardItem footer bordered button
                        onPress={() => {
                          this.closeModal();
                        }}>
                        <Text style={styles.centerAligned}>
                          Cancel
                        </Text>
                      </CardItem>
                    </Card>
                  </TouchableWithoutFeedback>
                </View>
              </View>
            </Modal>
          </View>
        );
      }
    }
//}

const styles = StyleSheet.create({
   container: {
     flex: 1,
     backgroundColor: '#EFF0F1'
   },
   textCenter: {
     justifyContent: 'center'
   },
   flexRow: {
     flexDirection: 'row',
     marginTop: 10,
     marginBottom: 10
   },
   inputBox: {
     height: 35,
     width: 150,
     marginLeft: 10,
     borderRadius: 20,
     padding: 7,
     fontSize: 18,
     borderWidth: 0.5,
     shadowColor: '#000000',
     shadowOffset: {
       width: 0,
       height: 3
     },
     shadowRadius: 10,
     shadowOpacity: 0.25,
     flex: 1,
     flexDirection: 'row',
     justifyContent: 'flex-end',
     alignItems: 'center',
   },
   buttonStyle: {
     backgroundColor: '#ee3224',
     borderRadius: 10,
     width: 250,
     height: 50,
     padding: 10,
     shadowColor: '#000000',
     shadowOffset: {
       width: 0,
       height: 3
     },
     shadowRadius: 10,
     shadowOpacity: 0.25,
     flex: 1,
     justifyContent: 'center',
     alignItems: 'center',
   },
   disabledButton: {
     backgroundColor: '#fff',
     borderColor: '#ee3224',
     borderWidth: 2,
     borderRadius: 10,
     width: 250,
     height: 50,
     padding: 10,
     shadowColor: '#000000',
     shadowOffset: {
       width: 0,
       height: 3
     },
     shadowRadius: 10,
     shadowOpacity: 0.25,
     flex: 1,
     justifyContent: 'center',
     alignItems: 'center',
   },
   buttonText: {
     color: '#fff',
     fontSize: 18
   },
   disabledButtonText: {
     color: '#e0e1e2',
     fontSize: 18
   },
   touchStyle: {
     borderRadius: 10
   },
   center: {
     flex:1,
     alignItems:'center',
     justifyContent:'center'
   },
   statusStyle: {
    flexDirection:'row',
  },
  leftView: {
    flexDirection: 'row',
  },
  dataFont: {
    color: 'green',
    fontWeight: 'bold'
  },
  dataTitleFont: {
    fontWeight: '600',
    color: '#426288'
  },
  titleFont: {
    fontWeight: '600',
    textAlign: 'center',
  },
  flexRow2: {
    flexDirection:'column',
    flex: 1
  },
  centerAligned: {
    textAlign: 'center',
    flex: 1
  }
 });
