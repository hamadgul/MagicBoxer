import React, { Component } from 'react';
import { Container, Header, Content, Card, CardItem, Body, Text } from 'native-base';
import { ActivityIndicator, View, Dimensions, TouchableOpacity, StyleSheet, Button, Alert, FlatList } from 'react-native';
import AppNavigator from '../navigation/AppNavigator';
import { Dropdown } from 'react-native-material-dropdown-v2';

const API_KEY = "EA974070-98C6-4DC1-B449-CAE6BB93A9F6";
const URL = 'https://stage.commerceapi.io/api/v1/Orders?subscription-key=';
const URL1 = 'https://stage.commerceapi.io/api/v1/Orders?Filters.status=Ready%20to%20Ship&subscription-key=';
const URL2 = 'https://stage.commerceapi.io/api/v1/Orders?Filters.status=Ignoroed&subscription-key='

const deviceHeight = Dimensions.get('window').height;

export default class OrderScreen extends Component {


    constructor(props) {
        super(props);
        this.state = {
          isLoading: true,
          showReadyStatus: true,
          showCompleteStatus: false,
          showIgnoredStatus: false,
          readyDataSource: [],
          completeDataSource: [],
          ignoredDataSource: []
        }
    }

    static navigationOptions = {
      headerLeft: null,
      gesturesEnabled: false,
      headerStyle: { backgroundColor: '#ee3224' },
      headerTitleStyle: { color: 'white' },
      title: "Orders"
    }

    setData = (orders) => {
      let readyData = [];
      let completeData = [];
      let ignoredData = [];
      for (order of orders) {

        /* Filters through the data to only show orders that are 'Ready to Ship'
         * For Demo day purposes, we added Ignored Statuses to show how to algorithm works
         */
        if (order.Status === 'Ready to Ship' && order.OrderNumber != '0116728636W') {
          readyData.push(order);
        } else if (order.Status === 'Complete') {
          /* removes the order if it is not within the same year or not within two weeks of the current date
           * Commented out for Demo Day to show completed statuses
           */

          // let date = new Date();
          // let orderDate = new Date(order.OrderDate);
          // if ((orderDate.getYear() == date.getYear())
          // && (((orderDate.getMonth() == date.getMonth) && ((orderDate.getDay() - date.getDay()) < 14))
          // || ((orderDate.getMonth() != date.getMonth) && ((orderDate.getDay() - date.getDay()) > 14)))) {
          completeData.push(order);
          // }
        } else if (order.Status === 'Ignored' && order.OrderNumber != '0116728636W') {
          ignoredData.push(order);
        }
      }
      var allReadyData = readyData.concat(this.state.readyDataSource);
      var allIgnoredData = ignoredData.concat(this.state.ignoredDataSource);
      var allCompletedData = completeData.concat(this.state.completeDataSource);

      this.setState({
          isLoading: false,
          readyDataSource: allReadyData,
          completeDataSource: allCompletedData,
          ignoredDataSource: allIgnoredData
      });
    }

    onFilterChange = (orderType) => {
      if (orderType === 'Ready to Ship Orders') {
        this.setState({
          showReadyStatus: true,
          showCompleteStatus: false,
          showIgnoredStatus: false,
        });
      } else if (orderType === 'Completed Orders') {
        this.setState({
          showReadyStatus: false,
          showCompleteStatus: true,
          showIgnoredStatus: false,
        });
      } else if (orderType === 'Ignored Orders') {
        this.setState({
          showReadyStatus: false,
          showCompleteStatus: false,
          showIgnoredStatus: true,
        });
      } else {
        this.setState({
          showReadyStatus: true,
          showCompleteStatus: true,
          showIgnoredStatus: true,
        });
      }
    }

    componentDidMount = () => {
        return fetch(URL + API_KEY, {
            method: 'GET',
            headers: new Headers({
                'Content-Type': 'application/json'
            }),
        })
          .then((response) => response.json())
          .then((responseJson) => {
            console.log(responseJson.Body.SalesOrders);
            this.setData(responseJson.Body.SalesOrders);
          }).then(fetch(URL1 + API_KEY, {
              method: 'GET',
              headers: new Headers({
                  'Content-Type': 'application/json'
              }),
          })
            .then((response) => response.json())
            .then((responseJson) => {
              console.log(responseJson.Body.SalesOrders);
              this.setData(responseJson.Body.SalesOrders);
            }))
          .catch((error) => {
              console.error(error);
          });
    }

    renderCard = (item, i) => {
        return(
          <Card key={item.LogicbrokerKey} style={styles.orderContainer}>
              <CardItem header bordered>
                  <Text style={styles.generalFont}>Order Number: {item.OrderNumber}</Text>
              </CardItem>
              <CardItem>
                <Body>
                  <View style={styles.flexRow}>
                    <View style={styles.statusStyle}>
                        <Text style={styles.dataTitleFont}>Status:</Text>
                        <Text style={styles.dataFont}>{'\t'}{item.Status}</Text>
                    </View>
                    <View style={styles.leftView}>
                      <Text style={styles.dataTitleFont}> Date:</Text>
                      <Text style={styles.dataFont}>{'\t'}{item.OrderDate.substring(0,10)}</Text>
                    </View>
                  </View>
                </Body>
              </CardItem>
              <CardItem footer button bordered
                onPress = {() => {
                    const { navigate } = this.props.navigation;
                    navigate('Details', { LogicBrokerKey: item.LogicbrokerKey });
                  }}>
                <Text style={styles.generalFont}>
                  Details {'>>'}
                </Text>
              </CardItem>
          </Card>
        );
    }

    render() {
      let data = [{
        value: 'Ready to Ship Orders',
      }, {
        value: 'Ignored Orders'
      }, {
        value: 'Completed Orders'}];

        if (this.state.isLoading) {
            return (
                <View style={{flex: 1, padding: 20}}>
                    <ActivityIndicator/>
                </View>
            )
        }
        else {
            return (
                <View style={{flex: 1}}>
                    <Container style={styles.container}>
                        <Content padder>
                        <Dropdown
                          label='Filter by Order Type'
                          data={data}
                          onChangeText={(value) => {
                            this.onFilterChange(value);
                          }}
                        />
                          {this.state.showReadyStatus && (
                            <View style={{paddingBottom: 10}}>
                              <Card>
                                <CardItem header bordered>
                                  <Text style={styles.titleFont}>Ready to Ship Order(s)</Text>
                                </CardItem>
                              </Card>
                              <FlatList
                                  style={styles.flatList}
                                  data={this.state.readyDataSource}
                                  keyExtractor={item => item.LogicbrokerKey.toString()}
                                  renderItem={({item, index}) => {
                                      return (this.renderCard(item, index));
                                  }}
                              />
                            </View>)
                          }
                          {(this.state.showCompleteStatus && this.state.showReadyStatus) &&
                            (<View
                              style={{
                                borderBottomColor: '#9b9b9b',
                                borderBottomWidth: 1,
                              }}
                            />)
                          }
                          {this.state.showIgnoredStatus  && (
                            <View style={{paddingTop: 10} }>
                              <Card>
                                <CardItem header bordered>
                                  <Text style={styles.titleFont}>Ignored Order(s)</Text>
                                </CardItem>
                              </Card>
                              <FlatList
                                  style={styles.flatList}
                                  data={this.state.ignoredDataSource}
                                  keyExtractor={item => item.LogicbrokerKey.toString()}
                                  renderItem={({item, index}) => {
                                      return (this.renderCard(item, index));
                                  }}
                              />
                            </View>)
                          }
                          {this.state.showCompleteStatus  && (
                            <View style={{paddingTop: 10} }>
                              <Card>
                                <CardItem header bordered>
                                  <Text style={styles.titleFont}>Completed Order(s)</Text>
                                </CardItem>
                              </Card>
                              <FlatList
                                  style={styles.flatList}
                                  data={this.state.completeDataSource}
                                  keyExtractor={item => item.LogicbrokerKey.toString()}
                                  renderItem={({item, index}) => {
                                      return (this.renderCard(item, index));
                                  }}
                              />
                            </View>)
                          }
                        </Content>
                    </Container>
                </View>
            );
        }
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#EFF0F1'
    },
    flatList:{
        flex:1,
    },
    orderContainer: {
        borderWidth: 1,
        backgroundColor: '#fff'
    },
    flexRow: {
      flexDirection:'row',
      flex: 1
    },
    statusStyle: {
      flex:0.5,
      flexDirection:'column',
      borderRightWidth: 1,
      borderRightColor: '#c9c9c9'
    },
    leftView: {
      flexDirection: 'column',
      flex: 0.5,
      alignSelf: 'flex-end'
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
    }
});
