export default function ItemDetailsModal(props) {
  return (
    <View style={styles.centeredView}>
      <Modal visible={props.visible} animationType="slide" transparent={true}>
        <View style={styles.centeredView}>
          <View style={styles.modalContent}>
            <Text style={styles.label}>Item Name: {props.item.itemName}</Text>
            <Text style={styles.label}>Length: {props.item.itemLength}"</Text>
            <Text style={styles.label}>Width: {props.item.itemWidth}"</Text>
            <Text style={styles.label}>Height: {props.item.itemHeight}"</Text>
            <Button
              onPress={() => props.handleDeleteAndClose(props.item)}
              title="Delete"
              color="#FF6347" // Red color for delete button
            />
            <Button
              onPress={props.closeModal}
              title="Close"
              color="#1C6EA4" // Color matching the label color
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}
