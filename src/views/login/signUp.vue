<template>
  <amplify-authenticator>
    <amplify-sign-in
      slot="sign-in"
      header-text="GPS Manager"
    >
      <div slot="header-subtitle" />
      <div slot="federated-buttons" style="padding-bottom: 10px">
        <GoogleButton></GoogleButton>
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
import GoogleButton from '@/views/login/GoogleButton'
export default {
  name: 'SignUp',
  components: { GoogleButton }
}
</script>

<style lang="scss" scoped>

amplify-authenticator {
  display: flex;
  justify-content: center;
}

amplify-authenticator {
  --container-height: 100%;
  --background-color: green
}
</style>
