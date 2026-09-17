module.exports = class block {
    constructor(block_number, time_stamp, parent_hash, block_hash, ch_hash, sealer_node_id, origin_node_id, userdata_address) {
        this.block_number = block_number;
        this.time_stamp = time_stamp;
        this.parent_hash = parent_hash;
        this.block_hash = block_hash;
        this.ch_hash = ch_hash;
        this.sealer_node_id = sealer_node_id;
        this.origin_node_id = origin_node_id;
        this.userdata_address = userdata_address;
    }
}