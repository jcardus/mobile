<template>
  <f7-page>
    <f7-navbar title="Mensagens">
      <f7-nav-right>
        <f7-link popup-close>Fechar</f7-link>
      </f7-nav-right>
    </f7-navbar>

    <f7-messagebar
      ref="messagebar"
      :placeholder="placeholder"
      :attachments-visible="attachmentsVisible"
      :sheet-visible="sheetVisible"
    >
      <f7-link
        slot="inner-start"
        icon-ios="f7:camera_fill"
        icon-aurora="f7:camera_fill"
        icon-md="material:camera_alt"
        @click="sheetVisible = !sheetVisible"
      ></f7-link>
      <f7-link
        slot="inner-end"
        icon-ios="f7:arrow_up_circle_fill"
        icon-aurora="f7:arrow_up_circle_fill"
        icon-md="material:send"
        @click="sendMessage"
      ></f7-link>
      <f7-messagebar-attachments>
        <f7-messagebar-attachment
          v-for="(image, index) in attachments"
          :key="index"
          :image="image"
          @attachment:delete="deleteAttachment(image)"
        ></f7-messagebar-attachment>
      </f7-messagebar-attachments>
      <f7-messagebar-sheet>
        <f7-messagebar-sheet-image
          v-for="(image, index) in images"
          :key="index"
          :image="image"
          :checked="attachments.indexOf(image) >= 0"
          @change="handleAttachment"
        ></f7-messagebar-sheet-image>
      </f7-messagebar-sheet>
    </f7-messagebar>

    <f7-messages ref="messages">
      <f7-messages-title><b>Sunday, Feb 9,</b> 12:58</f7-messages-title>
      <f7-message
        v-for="(message, index) in messagesData"
        :key="index"
        :type="message.type"
        :image="message.image"
        :name="message.name"
        :avatar="message.avatar"
        :first="isFirstMessage(message, index)"
        :last="isLastMessage(message, index)"
        :tail="isTailMessage(message, index)"
      >
        <span v-if="message.text" slot="text" v-html="message.text"></span>
      </f7-message>
      <f7-message
        v-if="typingMessage"
        type="received"
        :typing="true"
        :first="true"
        :last="true"
        :tail="true"
        :header="`${typingMessage.name} is typing`"
        :avatar="typingMessage.avatar"
      ></f7-message>
    </f7-messages>
  </f7-page>
</template>
<script>
import { mapGetters } from 'vuex'

export default {
  data() {
    return {
      attachments: [],
      sheetVisible: false,
      typingMessage: null,
      messagesData: [
        {
          type: 'sent',
          text: 'Aloooo?'
        },
        {
          type: 'sent',
          text: 'Está aí alguém?'
        },
        {
          name: 'Joaquim Cardeira',
          type: 'received',
          text: 'Bom dia, podes carregar?',
          avatar: 'https://eu.ui-avatars.com/api/?name=Joaquim+Cardeira&rounded=true'
        },
        {
          type: 'sent',
          text: 'Estou vazio, estou à espera...'
        },
        {
          type: 'sent',
          image: 'https://cdn.24.co.za/files/Cms/General/d/7490/8fdf965e64cf4eb4ac602a921af2a285.png'
        },
        {
          name: 'Joaquim Cardeira',
          type: 'received',
          text: 'Anda-te embora, caga nesses gajos!',
          avatar: 'https://eu.ui-avatars.com/api/?name=Joaquim+Cardeira&rounded=true'
        }
      ],
      images: [
        'https://cdn.framework7.io/placeholder/cats-300x300-1.jpg',
        'https://cdn.framework7.io/placeholder/cats-200x300-2.jpg',
        'https://cdn.framework7.io/placeholder/cats-400x300-3.jpg',
        'https://cdn.framework7.io/placeholder/cats-300x150-4.jpg',
        'https://cdn.framework7.io/placeholder/cats-150x300-5.jpg',
        'https://cdn.framework7.io/placeholder/cats-300x300-6.jpg',
        'https://cdn.framework7.io/placeholder/cats-300x300-7.jpg',
        'https://cdn.framework7.io/placeholder/cats-200x300-8.jpg',
        'https://cdn.framework7.io/placeholder/cats-400x300-9.jpg',
        'https://cdn.framework7.io/placeholder/cats-300x150-10.jpg'
      ],
      people: [
        {
          name: 'Joaquim Cardeira',
          avatar: 'https://eu.ui-avatars.com/api/?name=Joaquim+Cardeira&rounded=true'
        }
      ],
      answers: [
        'Baza daí!!!',
        'Já disse',
        'Ai ai ai ai ai...',
        'Tu queres ver???',
        'Queres ver que eu vou ter que me chatear???'
      ],
      responseInProgress: false
    }
  },
  computed: {
    ...mapGetters(['user']),
    attachmentsVisible() {
      const self = this
      return self.attachments.length > 0
    },
    placeholder() {
      const self = this
      return self.attachments.length > 0 ? 'Add comment or Send' : 'Message'
    }
  },
  mounted() {
    this.$log.info('Messages', this.user.avatar)
    const self = this
    self.$f7ready(() => {
      self.messagebar = self.$refs.messagebar.f7Messagebar
      self.messages = self.$refs.messages.f7Messages
    })
  },
  methods: {
    isFirstMessage(message, index) {
      const self = this
      const previousMessage = self.messagesData[index - 1]
      if (message.isTitle) return false
      return !previousMessage || previousMessage.type !== message.type || previousMessage.name !== message.name
    },
    isLastMessage(message, index) {
      const self = this
      const nextMessage = self.messagesData[index + 1]
      if (message.isTitle) return false
      return !nextMessage || nextMessage.type !== message.type || nextMessage.name !== message.name
    },
    isTailMessage(message, index) {
      const self = this
      const nextMessage = self.messagesData[index + 1]
      if (message.isTitle) return false
      return !nextMessage || nextMessage.type !== message.type || nextMessage.name !== message.name
    },
    deleteAttachment(image) {
      const self = this
      const index = self.attachments.indexOf(image)
        self.attachments.splice(index, 1)[0]; // eslint-disable-line
    },
    handleAttachment(e) {
      const self = this
      const index = self.$$(e.target).parents('label.checkbox').index()
      const image = self.images[index]
      if (e.target.checked) {
        // Add to attachments
        self.attachments.unshift(image)
      } else {
        // Remove from attachments
        self.attachments.splice(self.attachments.indexOf(image), 1)
      }
    },
    sendMessage() {
      const self = this
      const text = self.messagebar.getValue().replace(/\n/g, '<br>').trim()
      const messagesToSend = []
      self.attachments.forEach((attachment) => {
        messagesToSend.push({
          image: attachment
        })
      })
      if (text.trim().length) {
        messagesToSend.push({
          text
        })
      }
      if (messagesToSend.length === 0) {
        return
      }

      // Reset attachments
      self.attachments = []
      // Hide sheet
      self.sheetVisible = false
      // Clear area
      self.messagebar.clear()
      // Focus area
      if (text.length) self.messagebar.focus()
      // Send message
      self.messagesData.push(...messagesToSend)

      // Mock response
      if (self.responseInProgress) return
      self.responseInProgress = true
      setTimeout(() => {
        const answer = self.answers[Math.floor(Math.random() * self.answers.length)]
        const person = self.people[Math.floor(Math.random() * self.people.length)]
        self.typingMessage = {
          name: person.name,
          avatar: person.avatar
        }
        setTimeout(() => {
          self.messagesData.push({
            text: answer,
            type: 'received',
            name: person.name,
            avatar: person.avatar
          })
          self.typingMessage = null
          self.responseInProgress = false
        }, 4000)
      }, 1000)
    }
  }
}
</script>
