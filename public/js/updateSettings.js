/* eslint-disable */
import axios from 'axios'; // can alson use axios from a cdn
import { showAlert } from './alerts';

//type is either password or data
export const updateSettings = async (data, type) => {
  try {
    const url =
      type === 'password'
        ? 'http://127.0.0.1:3000/api/v1/users/updatePassword'
        : 'http://127.0.0.1:3000/api/v1/users/updateMe';

    const res = await axios({
      method: 'PATCH',
      url,
      data,
    });

    console.log(res);

    ///?? dont get why 'sucess works instead of sucess
    if (res.data.status === 'success') {
      showAlert(
        'success',
        `${type.toUpperCase()}account details updated succesfully'`,
      );
      location.reload(true);
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};
