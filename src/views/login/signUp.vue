<template>
  <amplify-authenticator>
    <amplify-sign-in
      slot="sign-in"
      header-text="GPS Manager"
    >
      <div slot="header-subtitle" />
      <div slot="federated-buttons" style="padding-bottom: 10px">
        <a @click="googleLogin">
          <div class="google-btn">
            <div class="google-icon-wrapper">
              <img alt="" class="google-icon" src="https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg">
            </div>
            <p class="btn-text"><b>Sign in with Google</b></p>
          </div>
        </a>
      </div>
    </amplify-sign-in>
    <amplify-sign-up
      slot="sign-up"
      username-alias="email"
    />
    <div>
      <amplify-sign-out />
    </div>
  </amplify-authenticator>
</template>

<script>
export default {
  name: 'SignUp'
}
</script>

<style lang="scss" scoped>
$white: #fff;
$google-blue: #4285f4;
$button-active-blue: #1669F2;

.google-btn {
  height: 42px;
  background-color: $google-blue;
  border-radius: 2px;
  box-shadow: 0 3px 4px 0 rgba(0,0,0,.25);
  .google-icon-wrapper {
    position: absolute;
    margin-top: 1px;
    margin-left: 1px;
    width: 40px;
    height: 40px;
    border-radius: 2px;
    background-color: $white;
  }
  .google-icon {
    position: absolute;
    margin-top: 11px;
    margin-left: 11px;
    width: 18px;
    height: 18px;
  }
  .btn-text {
    margin: auto;
    padding-left: 50px;
    padding-right: 10px;
    padding-top: 11px;
    color: $white;
    font-size: 14px;
    text-align: center;
  }
  &:hover {
    box-shadow: 0 0 6px $google-blue;
  }
  &:active {
    background: $button-active-blue;
  }
}
amplify-authenticator {
  display: flex;
  justify-content: center;
}

amplify-authenticator {
  --container-height: 100%;
  --background-color: green
}
</style>
