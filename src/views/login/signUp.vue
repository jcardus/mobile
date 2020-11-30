<template>
  <amplify-authenticator>
    <amplify-sign-in
      slot="sign-in"
      :header-text="headerText"
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
import * as partner from '@/utils/partner'
export default {
  name: 'SignUp',
  components: { GoogleButton },
  computed: {
    headerText() {
      return partner.getTitle()
    }
  }
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
