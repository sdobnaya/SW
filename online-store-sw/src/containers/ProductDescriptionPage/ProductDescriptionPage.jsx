//Core
import React from 'react';
import { connect } from 'react-redux';
import { gql } from '@apollo/client'; 

//Locals
import './ProductDescriptionPage.css';
import TextInput from '../../components/Inputs/TextInput';
import SwatchInput from '../../components/Inputs/SwatchInput';
import { client } from '../..';
import { setNewProductToCart } from '../../lib/redux/actions';
import  store from '../../lib/redux/store';

class ProductDescriptionPage extends React.Component {
    constructor() {
        super();

        this.state = {
            data: [],
            error: '',

            productDetails: {
                inputsInfo: {},
            },
        };

        this.getData = this.getData.bind(this);
        this.changeImage = this.changeImage.bind(this);
        this.handleInput = this.handleInput.bind(this);
        this.handleOrder = this.handleOrder.bind(this);
        this.getOrderId = this.getOrderId.bind(this);
        this.checkDuplicates = this.checkDuplicates.bind(this);
        this.checkInputs = this.checkInputs.bind(this);
        this.sanitizeData = this.sanitizeData.bind(this);

        this.mainImageRef = React.createRef();
    }

    async getData() {
        const { 
            id, 
            name, 
            brand, 
            gallery, 
            prices, 
            attributes, 
        } = this.state.data;

        let queryID = null;
        if (localStorage.getItem('PDP_ID')) {
            queryID = localStorage.getItem('PDP_ID');
        } 
        else {
            queryID = id;
        }

        await client.query({
            query: gql`
                query($id: String!) {
                    product(id: $id) {
                        id,
                        name,
                        inStock,
                        gallery,
                        description,
                        category,
                        attributes {
                            id,
                            name,
                            type,
                            items {
                                displayValue,
                                value,
                                id,
                            },
                        },
                        prices {
                            currency {
                                label, 
                                symbol 
                            },
                            amount,
                        },
                        brand,
                    }
                }`, 
                variables: { id: queryID }
            }).then((result) =>  this.setState({ data: result.data.product }))
            .catch((error) => this.setState({ error: error }))

        setTimeout(() => { 
            this.setState({
                productDetails: {
                    name: name,
                    brand: brand,
                    img: gallery,
                    product_id: id,
                    prices: prices,
                    attributes: attributes,
                    counter: 1,

                    inputsInfo: {},
                    orderID: '',
                }
            });
        }, 500);

    }

    changeImage(imageSrc) {
        this.mainImageRef.current.src = imageSrc;
    }

    handleInput(event) {
        const { 
            id, 
            name, 
            brand, 
            gallery, 
            prices, 
            attributes, 
        } = this.state.data;

        this.setState(prevValue => ({
            productDetails: {
                name:name,
                brand: brand,
                img: gallery,
                product_id: id,
                prices: prices,
                attributes: attributes,
                counter: 1,

                inputsInfo: {...prevValue.productDetails.inputsInfo, ...{
                    [`${event.className}  ${event.name}`]: event.value,
                }},

                orderID: '',
            }
        }));
    }

    handleOrder(event) {
        const { name, inputsInfo } = this.state.productDetails;

        event.preventDefault();
        let requiredInputSet = this.checkInputs();

        if (requiredInputSet.size) {
            const missingInputsArr = Array.from(requiredInputSet);
            alert(`Choose product features before continue: ${ missingInputsArr }`)
        } 
        else {
            this.getOrderId(name, inputsInfo);
            setTimeout(() => {
                let state = store.getState();
                let finalData = this.checkDuplicates(state.setNewProductToCart, this.state.productDetails);
                let totalNumber = finalData.reduce((acc, obj) => { return acc + obj.counter; }, 0);
                this.props.appCartAmountCallback(totalNumber);
                this.props.dispatch(setNewProductToCart(finalData));

                if (!localStorage.getItem('currentOrder')) {
                    localStorage.setItem('currentOrder', JSON.stringify([this.state.productDetails]));
                    this.props.appCartAmountCallback(1);
                }
                
                localStorage.setItem('currentOrder', JSON.stringify(finalData));

                Array.from(document.getElementsByTagName('input')).map((element) => {
                    if (!element.className.includes('minicart')) {
                        element.checked = false;
                    }
                    return null;
                })
            }, 0);
        }
    }

    getOrderId(name, attrObj) {
        let orderedObj = null;

        Object.keys(attrObj).sort().reduce(
            (obj, key) => { 
                obj[key] = attrObj[key]; 
                orderedObj = obj;
                return obj;
            }, {}
        );

        this.setState(prevValue => ({
            ...prevValue,
            productDetails: {
                ...prevValue.productDetails,
                orderID: `${name}${JSON.stringify(orderedObj)}`
            }
        }));
    }

    checkDuplicates(arr, newEl) {
        let check = arr;

        let res = arr.map((order) => {
            return ( order.orderID === newEl.orderID ?
                {
                    ...order,
                    counter: order.counter + 1,
                }
            : 
                {
                    ...order
                }
            );
        })

        arr = [...arr, newEl];

        return JSON.stringify(res) === JSON.stringify(check) ? arr : res;
    }

    checkInputs() {
        const { 
            id, 
            name, 
            brand, 
            gallery, 
            prices, 
        } = this.state.data;

        let requiredInputSet = new Set(
            Array.from(document.getElementsByClassName('input')).map((el) => { 
                return el.name;
            })
        );

        if (!requiredInputSet) {
            this.setState({
                productDetails: {
                    name: name,
                    brand: brand,
                    img: gallery,
                    product_id: id,
                    prices: prices,
                    attributes: null,
                    counter: 1,
    
                    inputsInfo: null,
    
                    orderID: '',
                }
            });
        }

        let allInputsArr = Array.from(document.getElementsByTagName('input'));

        allInputsArr.map((el) => {
            if (el.checked) {
                requiredInputSet.delete(el.name);
            }
            return null;
        });

        return requiredInputSet;
    }

    sanitizeData(data) {
        if (data) {
            if (data.includes('<script>') || 
                data.includes('<object>') || 
                data.includes('<embed>') || 
                data.includes('<link>') || 
                data.includes('onClick') || 
                data.includes('eval')) {
                return 'Something went wrong with the description. Please, try to reload the page'
            } 
            else {
                return data
            }
        }
    }

    componentDidMount() {
        this.getData();
    }

    render() {
        const { newCurrency } = this.props;
        const { gallery, inStock, brand, name, attributes, prices, description } = this.state.data;

        return (
            <div className="product__root">
                <div className="product-wrapper product__individual-wrapper">
                    <div className="product__images">
                        <div className = { gallery?.length > 4 ? "product__side-images__many" : "product__side-images" }>

                            { gallery?.map((picture) => {
                                return <img className="image__mini" key={ picture } src={ picture } alt="product description" onClick={ ()=>{ this.changeImage(picture) } }/>
                            }) }

                        </div>
                        <div className = { inStock ? null : "product-image__outofstock-wrapper"}>
                            { inStock ? null : <p className="product-image__outofstock-title">OUT OF STOCK</p> }
                            <img ref={ this.mainImageRef } className="product__main-image" src={ gallery?.[0] } alt="product main description" />
                        </div>
                    </div>

                    <form onSubmit = { this.handleOrder } className="product__info-form">
                        <p className="info-form__brand-name">{ brand }</p>
                        <p className="info-form__item-name">{ name }</p>

                        { attributes?.map((attribute) => {
                            return attribute.type === 'text' ?
                                <TextInput key={ attribute.id } dataArr={ attribute } pdpCallback = { this.handleInput } /> 
                                : 
                                <SwatchInput key={ attribute.id } dataArr={ attribute } pdpCallback = { this.handleInput }  />;
                            }) 
                        }

                        <p className="info-form__price-title">PRICE:</p>
                        <p className="info-form__price">

                            { prices?.map((potentialPrice) => {
                                return potentialPrice.currency.label === newCurrency[1] ? `${newCurrency[0]} ${(potentialPrice.amount).toFixed(2)}` : null;
                            })}

                        </p>

                        { inStock ? 
                            <button className="info-form__submit-button" type="submit" onClick={ this.handleOrder } >ADD TO CART</button>
                            :
                            <button className="info-form__submit-button__disabled">OUT OF STOCK</button>
                        }
                        <div className="info-form__description" dangerouslySetInnerHTML={ {__html: this.sanitizeData(description)} } />
                    </form>
                </div>
                <div className='product__sticky-footer' />
            </div>
        )
    }
}

export default connect()(ProductDescriptionPage);
