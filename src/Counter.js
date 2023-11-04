import React from "react";

/* 
  Never define functions in the render() method! 
  This will cause the component to re-render every time the parent component re-renders. 
  This is a performance issue.
  Instead, define functions as class methods.
  React components created with classes have no built-in binding.
  If you forget to bind this.handleClick and pass it to onClick,
  this will be undefined when the function is actually called.
  This is a common source of bugs in React applications.

  We can define simple logic in the render() method. 
  For example, we can use the ternary operator to conditionally render elements.
  We can also use the && operator to conditionally render elements.

  The render() method is called each time the state changes or the component (renders) receives new props.
*/

class Counter extends React.Component {
  constructor(props) {
    // Always call super() as the first thing you do in an extended constructor!
    super(props);

    // State is often initialized in the constructor
    this.state = { count: 0 };

    // JavaScript components created with classes have no built-in binding.
    // If you forget to bind this.handleClick and pass it to onClick,
    // this will be undefined when the function is actually called.
    this.handleDecrement = this.handleDecrement.bind(this);
    this.handleIncrement = this.handleIncrement.bind(this);
  }

  handleDecrement() {
    console.log(this); // debug

    // State is updated by calling this.setState()
    // React will merge the object you pass into setState()
    // with the current state of the component.
    this.setState((prevState) => {
      // prevState is a convention
      return { count: prevState.count - 1 };
    });
  }

  handleIncrement() {
    console.log(this); // debug

    this.setState((prevState) => {
      return { count: prevState.count + 1 };
    });
  }

  render() {
    const date = new Date();
    date.setDate(date.getDate() + this.state.count);

    return (
      <div>
        <button onClick={this.handleDecrement}>-</button>
        <span>
          {date.toDateString()} {this.state.count}
        </span>
        <button onClick={this.handleIncrement}>+</button>
      </div>
    );
  }
}

export default Counter;
