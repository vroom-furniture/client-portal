import * as React from "react"

export class Setup extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            preferredSetup: props.preferredSetup,
            currentSetup: props.currentSetup,
            icon: props.preferredSetup.icon,
            roomHolderHeight: 0
        }
    }

    componentDidMount() {
        // Perform jQuery actions after the DOM is rendered. Otherwise the elements are not found
        let draggable = $(".draggable");
        draggable.draggable({
            containment: "parent",
            grid: [10, 10]
        });

        this.G_eRoomHolder = $("#room");
        this.G_eRoomGrid = $("#roomGrid");
        this.G_eRoomGridTopBar = $("#roomGridTopBar");
        this.G_eRoomGridSideBar = $("#roomGridSideBar");
        this.G_eTable = $("#table1");
        this.G_eTableOutline = $("#outline1");

        let icon_picker = $('.icp-dd');
        icon_picker.iconpicker({ selected: this.state.icon });
        icon_picker.on('iconpickerSelected', function (e) {
            let iconClass = e.iconpickerInstance.options.fullClassFormatter(e.iconpickerValue)
            this.setState({ icon: iconClass })
        }.bind(this))

        this.resizeRoom();
    }

    // This makes sure that the current position is updated without a complete re-render of the component
    static getDerivedStateFromProps(props, state) {
        if (props.currentSetup != state.currentSetup) {
            // Convert to pixels
            localStorage.setItem(
                "currentPositionInCm",
                JSON.stringify(props.currentSetup)
            )

            return {
                ...state,
                currentSetup: props.currentSetup
            }
        }

        return state
    }

    drawTable(fTableWidth, fTableLength) {
        //Resize table dimensions based on this aspect ratio
        let fWidth = (fTableWidth / this.state.preferredSetup.fRoomWidth) * 100;
        let fLength = (fTableLength / this.state.preferredSetup.fRoomLength) * 100;

        // When editable only the table is shown and draggable. Otherwise the outline is the preferd position and the table the actual
        if (this.props.editable) {
            return <>
                <div id="table1" className={`table bg-lime draggable`} style={{ width: `${fWidth}%`, height: `${fLength}%`, top: this.state.preferredSetup.fTablePosY, left: this.state.preferredSetup.fTablePosX }}>01</div>
            </>
        }

        let currentSetup = { x_pos: this.cmToPixels(this.props.currentSetup.x_pos), y_pos: this.cmToPixels(this.props.currentSetup.y_pos) }

        return <>
            <div id="table1" className={`table table--animated bg-lime`} style={{ width: `${fWidth}%`, height: `${fLength}%`, top: currentSetup.y_pos, left: currentSetup.x_pos }}>01</div>
            <div id="outline1" className="table-outline" style={{ width: `${fWidth}%`, height: `${fLength}%`, top: this.state.preferredSetup.fTablePosY, left: this.state.preferredSetup.fTablePosX }}></div>
        </>
    }

    resizeRoom() {
        let fWidth = this.state.preferredSetup.fRoomWidth > this.state.preferredSetup.fRoomLength ? 100 : this.state.preferredSetup.fRoomWidth / this.state.preferredSetup.fRoomLength * 100;
        let fLength = this.state.preferredSetup.fRoomWidth > this.state.preferredSetup.fRoomLength ? this.state.preferredSetup.fRoomLength / this.state.preferredSetup.fRoomWidth * 100 : 100;

        //Animate  elements to fit aspect ratio.
        this.G_eRoomHolder.animate({
            "width": fWidth + "%",
            "height": fLength + "%"
        });

        this.G_eRoomGrid.animate({
            "width": "100%",
            "height": "100%"
        });

        this.G_eRoomGridTopBar.animate({
            "width": "100%"
        });

        this.G_eRoomGridSideBar.animate({
            "height": "100%"
        });

        this.setState({ roomHolderHeight: this.G_eRoomHolder.height() })
    }

    onChangeRooomName(sRoomName) {
        this.setState(prevState => ({ preferredSetup: { ...prevState.preferredSetup, sRoomName: sRoomName } }))
    }

    onChangeRoomDimensions(fRoomWidth, fRoomLength) {
        this.setState(prevState => ({ preferredSetup: { ...prevState.preferredSetup, fRoomWidth: Number(fRoomWidth), fRoomLength: Number(fRoomLength) } }), () =>
            this.resizeRoom())
    }

    onSaveSetup() {
        let fNewTablePosX = this.G_eTable.position().left;
        let fNewTablePosY = this.G_eTable.position().top;

        this.props.saveSetup({
            ...this.state.preferredSetup,
            fTablePosX: fNewTablePosX,
            fTablePosY: fNewTablePosY,
            icon: this.state.icon
        });
    }

    pixelsToCm(pixels) {
        let onePixelInCm = (this.state.preferredSetup.fRoomLength * 100) / this.state.roomHolderHeight

        return pixels * onePixelInCm;
    }

    cmToPixels(centimers) {
        let oneCmInPixels = this.state.roomHolderHeight / (this.state.preferredSetup.fRoomLength * 100)

        return centimers * oneCmInPixels;
    }

    onExecute() {
        // Convert pixels into cm
        let preferredSetup = Object.assign({}, this.state.preferredSetup);
        let currentSetup = Object.assign({}, this.props.currentSetup);

        preferredSetup.fTablePosX = this.pixelsToCm(preferredSetup.fTablePosX);
        preferredSetup.fTablePosY = this.pixelsToCm(preferredSetup.fTablePosY);
        currentSetup.x_pos = currentSetup.x_pos;
        currentSetup.y_pos = currentSetup.y_pos;

        // Calculate path
        let distanceX = currentSetup.x_pos - preferredSetup.fTablePosX;
        let distanceY = currentSetup.y_pos - preferredSetup.fTablePosY;

        this.props.executeSetup(distanceX, distanceY);
    }

    render() {
        return <>
            <div className="container-fluid col-sm-12 center">
                <div className="row">
                    <div className="page-title text-dark">
                        <input
                            type="text"
                            placeholder="Insert Room Name"
                            value={this.state.preferredSetup.sRoomName}
                            onChange={e => this.onChangeRooomName(e.currentTarget.value)}
                            disabled={!this.props.editable}
                            id="roomNameInput"
                        />
                        {this.props.editable ? <>
                            <h2>Drag the tables to their desired location.</h2>
                            <div className="btn-group">
                                <button type="button" className="btn btn-secundary btn-lg iconpicker-component"><i
                                    className={this.state.icon}></i></button>
                                <button type="button" className="icp icp-dd btn btn-secundary btn-lg dropdown-toggle"
                                    data-selected="fa-car" data-toggle="dropdown">
                                    <span className="caret"></span>
                                    <span className="sr-only">Toggle Dropdown</span>
                                </button>
                                <div className="dropdown-menu"></div>
                            </div>
                        </>
                            : <h2>Press "Execute" to apply this setup</h2>}
                    </div>
                </div>
                <div className="row">
                </div>
                <div className="row">
                    <div className="col-12">
                        <div id="room-parent">
                            <div id="room">
                                <div id="roomGrid">
                                    {this.drawTable(this.state.preferredSetup.fTableWidth, this.state.preferredSetup.fTableLength)}
                                </div>
                                <div className=" col-12" id="roomGridTopBar">
                                    <div className="arrowLeft">◄</div>
                                    <div className="arrowRight">►</div>
                                    <div className="roomWidthInputParent">
                                        <input
                                            type="number"
                                            id="roomWidthInput"
                                            value={this.state.preferredSetup.fRoomWidth}
                                            placeholder="Insert Width"
                                            disabled={!this.props.editable}
                                            onChange={e => this.onChangeRoomDimensions(e.currentTarget.value, this.state.preferredSetup.fRoomLength)}
                                        />
                                    </div>
                                </div>
                                <div id="roomGridSideBar">
                                    <div className="arrowUp">▲</div>
                                    <div className="col-12" style={{ height: '20%' }}></div>
                                    <input
                                        type="number"
                                        id="roomLengthInput"
                                        value={this.state.preferredSetup.fRoomLength}
                                        placeholder="Length"
                                        disabled={!this.props.editable}
                                        onChange={e => this.onChangeRoomDimensions(this.state.preferredSetup.fRoomWidth, e.currentTarget.value)}
                                    />
                                    <div className="arrowDown">▼</div>
                                </div>

                                <div className="col-12 buttonHandler">
                                    <input type="button" value="Cancel" className="GridButton bg-light" onClick={_ => this.props.cancelSetup()} />
                                    {!this.props.editable && <input type="button" value="execute" className="GridButton bg-lime" onClick={_ => this.onExecute()} />}
                                    {this.props.editable && <input type="button" value="Save" className="GridButton bg-lime" onClick={_ => this.onSaveSetup()} />}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    }
}