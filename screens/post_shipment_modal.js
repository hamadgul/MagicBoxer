import * as React from 'react';
import { Text, View, StyleSheet, Button, Dimensions, ScrollView } from 'react-native';
import { Constants } from 'expo';
import Modal from "react-native-modal";
// You can import from local files
import AssetExample from './components/AssetExample';
import moment from "moment";
// or any pure javascript modules available in npm
import { Card } from 'react-native-paper';
import t from 'tcomb-form-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'

const Form = t.form.Form;

var Carrier = t.enums({
  USPS: 'USPS',
  UPS: 'UPS',
  FedEX: "Fedx",
});

const us_state = t.subtype(t.String, st => /^[a-zA-Z]+$/.test(st) && st.length === 2);


const User = t.struct({
  name: t.String,
  address: t.String,
  city: t.String,
  state: us_state,
  zip: t.Number,
  country: t.String,
  phone: t.Number,
  expectedDelivery: t.Date,
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



export default class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      shipmentModal: false,
    }
  }

  handleSubmit = () => {
    const value = this._form.getValue(); // use that ref to get the form value
    console.log('value: ', value);
  }

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

  render() {
    return (
      <View style={styles.container}>

        <Button onPress = {() => {
          this.setState({shipmentModal: true});
        }}
        title = "open"
        />

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
                  {this.handleSubmit}}
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
                options={options}
              />
            </View>

            </KeyboardAwareScrollView>

          </View>
        </Modal>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingTop: Constants.statusBarHeight,
    backgroundColor: '#ecf0f1',
    padding: 8,
  },
    fullModal: {
    backgroundColor: "white",
    borderRadius: 8,
    flex: 1,
    marginTop: Dimensions.get('window').height * 0.05,
    justifyContent: 'flex-start',
  },
  formView: {
    justifyContent: 'flex-start',
    flex: 1,
    padding: 20,
  }
});
