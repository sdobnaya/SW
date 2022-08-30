import React from "react";
import TextInput from "../Inputs/TextInput";


export default class MinicartItem extends React.Component{

    render(){
        return(
            <>
                <div className="minicart-item__info-wrapper">
                    <p className="info__brand-name"></p>
                    <p className="info__item-name"></p>
                    <p className="info__price"></p>
                    <div className="info__input-protector">
                        <TextInput />
                    </div>
                </div>
                <div className="minicart-item__action-wrapper"></div>
            </>
        )
    }
}