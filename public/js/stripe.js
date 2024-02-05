/* eslint-disable*/
import axios from 'axios';
import { showAlert } from './alerts';

const stripe = Stripe(
  'pk_test_51Oeu9YK2LMvq3TCM4uhpkxayIYzlUiUo4bq2dYlAH9DTEOsQdxQJPLeA6Rporm4sI2Zhf4aSN6KNHKZhiRvMcP7d00gg0oDSU5',
);

export const bookTour = async (tourId) => {
  try {
    // 1. get checkout session from the booking route endpoint

    // if u only want to do get u can skip write the type of request ie 'GET
    const session = await axios(
      `http://127.0.0.1:3000/api/v1/bookings/checkout-session/${tourId}`,
    );

    // create checkout form + credit card
    await stripe.redirectToCheckout({
      sessionId: session.data.session.id,
    });
  } catch (err) {
    console.log(showAlert('error', err));
  }
};
