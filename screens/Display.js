import Expo from "expo";
import React, { Component } from "react";
import { Vibration, ScrollView, FlatList, TouchableOpacity, Button, Dimensions, Alert, StyleSheet, Text, View, Animated, PanResponder, Slider, LogBox } from "react-native";
import { Container, Header, Content, Card, CardItem, Body, Input, Item } from 'native-base';
import AppNavigator from '../navigation/AppNavigator';

import {THREE} from "expo-three";
import { createDisplay, pack } from '../packing_algo/packing';
import {createShipment} from '../packing_algo/shipping';

import Modal from "react-native-modal";
import moment from "moment";
import t from 'tcomb-form-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import DropdownAlert from 'react-native-dropdownalert';


//console.disableYellowBox = true;
LogBox.ignoreAllLogs('VirtualizedLists should never be nested');
const API_KEY = "2F7A2B46-105D-4C37-8AF6-93CC96B8832D";

const deviceHeight = Dimensions.get('window').height;
const deviceWidth = Dimensions.get('window').width;

const scaleFontSize = (fontSize) => {
  const ratio = fontSize / 375;
  const newSize = Math.round(ratio * deviceWidth);
  return newSize;
}

//the following is all for the create shipment form. this will later be added to a different file for organization.
const Form = t.form.Form;

const us_state = t.subtype(t.String, st => /^[a-zA-Z]+$/.test(st) && st.length === 2);
const expectedDelivery = t.subtype(t.Date, d => moment().diff(d) < 0 || moment().isSame(d, 'day'));

var Carrier = t.enums({
  USPS: 'USPS',
  UPS: 'UPS',
  FedEX: "FedEx",
});

//the following can be used as a test, in order to fill in default values for the form
const Default = {
  name: "Warehouse 123",
  address: "123 Warehouse ST",
  city: "Shelton",
  state: "CT",
  zip: 55555,
  country: "US",
  phone: 55555,
  trackingNumber: "5555555555555555"
}

const User = t.struct({
  name: t.String,
  address: t.String,
  city: t.String,
  state: us_state,
  zip: t.Number,
  country: t.String,
  phone: t.Number,
  expectedDelivery: expectedDelivery,
  carrier: Carrier,
  trackingNumber: t.String,
  bol: t.maybe(t.String),
  pro: t.maybe(t.String),
  seal: t.maybe(t.String),
  trail: t.maybe(t.String),
});

const formStyles = {
  ...Form.stylesheet,
  formGroup: {
    normal: {
      marginBottom: 10
    },
  },
    // the style applied when a validation error occours
    error: {
      color: 'red',
      fontSize: 18,
      marginBottom: 7,
      fontWeight: '600'
    }
}

const options = {
    fields: {
      name: {
        label: 'Company Name'
      },
      trackingNumber: {
        label: 'Tracking Number'
      },
      state: {
        help: 'e.g. "CT"'
      },
      expectedDelivery: {
        mode: 'date',
        label: 'Expected Delivery',
        error: 'Please enter a valid date',
        config: {
          format: (date)=> moment(date).format("L")
        }
      },
      zip: {
        label: "Zip Code"
      },
      bol: {
        label: 'Bill of Landing'
      },
      pro: {
        label: 'PRO Number'
      },
      seal: {
        label: 'Seal Number'
      },
      trail: {
        label: 'Trailer Number'
      },
  },
  i18n: {
    optional: '',
    required: '*'
  },
  stylesheet: formStyles,
  autoCorrect: false,
  template: template,
};


  function template(locals) {
    // in locals.inputs you find all the rendered fields
    return (
      <View>
        <View style = {{height: 40}}>
          <Text style ={{fontSize: 20, fontWeight: 'bold'}}>Ship From Address</Text>
        </View>

        {locals.inputs.name}
        {locals.inputs.address}
        <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
          <View style = {{flex:1}}>
            {locals.inputs.city}
          </View>
          <View style={{paddingLeft: 10, paddingRight: 10}}>
            {locals.inputs.state}
          </View>
          <View style = {{flex:1}}>
            {locals.inputs.zip}
          </View>
        </View>
        <View style= {{flexDirection: 'row', justifyContent: 'space-between', flex: 1}}>
          <View style = {{paddingRight: 5, flex:1}}>
            {locals.inputs.country}
          </View>
          <View style = {{paddingLeft: 5, flex:1}}>
            {locals.inputs.phone}
          </View>
        </View>
        <View style ={{paddingBottom: 10, alignItems: 'center'}}>
          <Text> ----------------- </Text>
        </View>
        {locals.inputs.trackingNumber}
        <View style= {{flexDirection: 'row'}}>
          <View style = {{flex:1}}>
            {locals.inputs.expectedDelivery}
          </View>
          <View style = {{width: 90}}>
            {locals.inputs.carrier}
          </View>
        </View>
        <View style= {{flexDirection: 'row', justifyContent: 'space-between', flex: 1}}>
          <View style = {{paddingRight: 5, flex:1}}>
            {locals.inputs.bol}
          </View>
          <View style = {{paddingLeft: 5, flex:1}}>
            {locals.inputs.pro}
          </View>
        </View>
        <View style= {{flexDirection: 'row', justifyContent: 'space-between', flex: 1}}>
          <View style = {{paddingRight: 5, flex:1}}>
            {locals.inputs.seal}
          </View>
          <View style = {{paddingLeft: 5, flex:1}}>
            {locals.inputs.trail}
          </View>
        </View>
      </View>
    );
  }
//end of form Info


export default class Display extends Component {
  constructor(props) {
    super(props);
    this.params = this.props.navigation.state.params;
    this.state = {
      value: 0,
      itemKey: false,
      refresh: true,
      shipmentModal: false,
      sent: false,
    }
}

  static navigationOptions = {
    gesturesEnabled: false,
    title: "Packing Arrangement",
    headerStyle: { backgroundColor: '#ee3224' },
    headerTitleStyle: { color: 'white' },
    headerTintColor : 'white'
  }

//this will use the output from the shipment form to fill in the body of the json and send it to logicbroker's API
  // createShipment = () => {
  //
  //
  // }


  openItemModal = () => this.setState({itemKey: true});
  closeItemModal = () => this.setState({itemKey: false});

  openShipmentModal = () => this.setState({shipmentModal: true});
  closeShipmentModal = () => {
    this.setState({shipmentModal: false});
    this.props.navigation.navigate("OrdersScreen");
  };

  handleOnScroll = event => {
    this.setState({
      scrollOffset: event.nativeEvent.contentOffset.y,
    });
  };

  handleScrollTo = p => {
    if (this.scrollViewRef) {
      this.scrollViewRef.scrollTo(p);
    }
  }

//submit the shipment info. if it's fully filled out, pass it to createshipment. else, vibrate (and the form will turn red)
  handleSubmit = () => {
    var value = this._form.getValue();
    if (!value) {
      Vibration.vibrate(1);
    }
    else {
      console.log('value: ', value);
      console.log(this.params.orderDetails)
      var body = createShipment(this.params.orderDetails, value, [this.params.box.y, this.params.box.z, this.params.box.x]);
      var bodyJSON = JSON.stringify(body);
      fetch("https://stage.commerceapi.io/api/v1/Shipments?subscription-key=" + API_KEY, {
        method: 'POST',
        timeout: 0,
        headers: {
          'Content-Type': 'application/json'
        },
        body: bodyJSON
      }).then(res => res.json())
      .then(response => console.log("Success:", JSON.stringify(response)))
      .catch(error => console.error('Error:', error));

      // this.setState({shipmentModal: false});
      Alert.alert("Success", 'Shipment Created', [{text: 'Return to Orders', onPress: () => this.closeShipmentModal()},], {cancelable: false});
    }
  }

//render modal content for item info, allows for hiding/showing of items
  renderItemCard(item, i) {
    return(
        <Card key= {i}>
              <CardItem header bordered>
                  {item.dis.visible ? <Text style = {{color: item.color}}>Item SKU: {item.SKU}</Text> :
                                                <View style = {{flexDirection: 'row', justifyContent: 'space-between', flex:1}}>
                                                  <Text style = {{color: 'lightslategrey'}}>Item SKU: {item.SKU}</Text>
                                                  <Text style = {{color: 'lightslategrey'}}>Hidden</Text>
                                                </View>}
              </CardItem>
              <CardItem>
                  <Body>
                  <Text style= {{color: 'lightslategrey'}}>
                      Length: {item.x}"    Width: {item.z}"    Height: {item.y}"
                  </Text>
                  </Body>
              </CardItem>
              <CardItem footer button
                                  onPress = {() => {
                                      item.dis.visible =  !item.dis.visible;
                                      this.setState({refresh: !this.state.refresh});
                                    }}>
                  {item.dis.visible ? <Text>Hide</Text> : <Text>Show</Text>}
              </CardItem>
          </Card>
          );
  }

  render() {
    const newLocal = ({ flex: 1 }, { height: 400 });
    return (
      <View style = {styles.container}>
          <Text style = {{alignSelf: 'center', fontSize: scaleFontSize(20)}}>Box Required:</Text>
          <Text style = {{alignSelf: 'center', fontSize: scaleFontSize(20), padding: 10}}>
            <Text style = {{fontWeight: 'bold'}}>{this.params.box.x} in.</Text>
            <Text> x </Text>
            <Text style = {{fontWeight: 'bold'}}>{this.params.box.y} in.</Text>
            <Text> x </Text>
            <Text style = {{fontWeight: 'bold'}}>{this.params.box.z} in.</Text>
          </Text>
          <Expo.GLView
            style={newLocal}
            onContextCreate={this._onGLContextCreate}
          />

        <View style = {{ width: 300, alignSelf: 'center', padding: 10}}>

          <Slider
            step={0.01}
            maximumValue= {2}
            value = {this.state.value}
            minimumTrackTintColor = {'#ee3224'}
            maximumTrackTintColor = {'#ee3224'}
            onValueChange = {val => this.setState({value: val})}
          />

        </View>
        <View style = {styles.buttonStyle}>
          <Button
            onPress = {() => {
              this.openShipmentModal();
            }}
            title= 'Create Shipment'
            color = '#FFFFFF'
            accessibilityLabel ="Create shipment"
          />
        </View>
        <View style=  {{padding: 10}}> </View>
        <View style = {styles.buttonStyle}>
          <Button
            onPress = {() => {
              this.setState({itemKey: true})
            }}
            title= 'Item Info'
            color = '#FFFFFF'
            accessibilityLabel ="Hide/Highlight Items"
          />
        </View>

        <Modal
          isVisible = {this.state.itemKey}
          onBackdropPress={() => this.setState({itemKey: false})}
          backdropOpacity = {0.1}
          scrollTo = {this.handleScrollTo}
          scrollOffset = {this.state.scrollOffset}
          scrollOffsetMax = {400 - 300}
          style = {styles.bottomModal}>
          <View style = {styles.scrollableModal}>
            <ScrollView
              ref = {ref => (this.scrollViewRef = ref)}
              onScroll = {this.handleOnScroll}
              scrollEventThrottle = {25}>

              <Text style = {{padding: 10, alignSelf: 'center', fontSize: 30, color: "black"}}> Item Key </Text>
                <Button onPress = {() => {
                    for (var i = 0; i < this.params.items.length; i++) {
                      this.params.items[i].dis.visible = true;
                    }
                    this.setState({refresh: !this.state.refresh});
                  }}
                  title = "Show All"/>

                  <Button onPress = {() => {
                      for (var i = 0; i < this.params.items.length; i++) {
                        this.params.items[i].dis.visible = false;
                      }
                      this.setState({refresh: !this.state.refresh});
                    }}
                    title = "Hide All"/>
              <FlatList
                data= {this.params.items}
                extraData = {this.state.refresh}
                renderItem = { ({item, index}) => {
                                return(this.renderItemCard(item, index));
                              }}
                />
            </ScrollView>
          </View>
        </Modal>


        <Modal
          isVisible = {this.state.shipmentModal}>
          <View style = {styles.fullModal}>
            <View style = {{height: 50}}>
              <View style = {{flexDirection: 'row', justifyContent: 'space-between', flex: 1, alignItems: 'center', paddingLeft: 10, paddingRight: 10}}>
                <Button onPress = {() =>
                  this.setState({shipmentModal: false})}
                  title = "Cancel"
                  />
                <Text style = {{fontSize: 20}}>Create A Shipment</Text>
                <Button onPress = {() =>
                  {this.handleSubmit()}}
                  title = "Submit"
                  />
              </View>
            </View>
            <View style ={{borderBottomColor: 'lightslategray', borderBottomWidth: 1,}}/>
            <KeyboardAwareScrollView
              ref = {ref => (this.scrollViewRef = ref)}
              scrollEventThrottle = {25}>

            <View style = {styles.formView}>
              <Form
                ref={c => this._form = c}
                type={User}
                value = {Default}
                options={options}
              />
            </View>

            </KeyboardAwareScrollView>

          </View>
        </Modal>

        <Modal
          isVisible = {this.state.sent}
          backdropOpacity = {0.75}>
          <View style = {styles.fullModal}>
            <Text>Shipment Created</Text>
          </View>
        </Modal>
      </View>
    );
  }

//create display. this can be called each time to display multiple boxes - once the algorithm is capable
  _onGLContextCreate = async gl => {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
        75, gl.drawingBufferWidth / gl.drawingBufferHeight, 1, 10);
    const renderer = ExpoTHREE.createRenderer({ gl });
    renderer.setSize(gl.drawingBufferWidth, gl.drawingBufferHeight);


    //scale is to keep the box display small and in frame
    var scale = 10;
    if (Math.max(this.params.box.x, this.params.box.y, this.params.box.z) > 15) {
      scale = 20;
    }


    const geometry = new THREE.BoxGeometry(this.params.box.x/scale, this.params.box.y/scale, this.params.box.z/scale);
    const material = new THREE.MeshBasicMaterial({transparent: true, opacity: 0.25, color: 0x808080});
    const cube = new THREE.Mesh(geometry, material);
    scene.add(cube);

    //the following is to create a box with edges to more accurately show the container box. however, there is a bug where the second item added will not appear

    // var edge_geo = new THREE.BoxBufferGeometry(this.params.box.x/10 + 0.01, this.params.box.y/10 + 0.01, this.params.box.z/10 + 0.01);
    // var edge_mat = new THREE.LineBasicMaterial( {color: 0x000000, linewidth: 0.1} );
    // var edges = new THREE.LineSegments(new THREE.EdgesGeometry(edge_geo), edge_mat);
    // cube.add(edges);
    // edges.matrixAutoUpdate = true;

    // scene.add(edges);


    console.log(this.params.items);
    for (var i = 0; i < this.params.items.length; i++) {
      // edges.add(itemss[i].dis);
      cube.add(this.params.items[i].dis);
      console.log("item", this.params.items[i].SKU, "added");
    }


    camera.position.set(-1.2, 0.5, 2);
    camera.lookAt(0, 0, 0);


//animate function allows for the lift/box rotation. lift was played with to lift items at different heights (looked better)  however was not feasible
    const animate = () => {
      requestAnimationFrame(animate);
      // edges.rotation.y = this.state.value;
      cube.rotation.y = this.state.value;
      for (var i = 1; i <= this.params.items.length; i++) {
        // if (this.params.items[i-1].sec.includes("behind")) {
        //   this.params.items[i-1].dis.position.y = this.state.value + this.params.items[i-1].pos[1];
        // }
        // else {
          // console.log(itemss[i-1].sec);
          this.params.items[i-1].dis.position.y = .5 * this.state.value + this.params.items[i-1].pos[1];
        // }
      }
      renderer.render(scene, camera);
      gl.endFrameEXP();

    }
    animate();

    }
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'flex-start',
    padding: 10,
  },
  buttonStyle: {
    backgroundColor: '#ee3224',
    borderRadius: 10,
    width: 250,
    padding: 10,
    shadowColor: '#000000',
    alignSelf: 'center',
    shadowOffset: {
      width: 0,
      height: 3
    },
  },
  scrollableModal: {
    backgroundColor: "white",
    height: 400,
  },
  bottomModal: {
    justifyContent: "flex-end",
    margin: 0,
  },
  fullModal: {
    backgroundColor: "white",
    borderRadius: 8,
    flex: 1,
    marginTop: deviceHeight * 0.05,
    justifyContent: 'flex-start',
  },
  formView: {
    justifyContent: 'flex-start',
    flex: 1,
    padding: 20,
  }
});
